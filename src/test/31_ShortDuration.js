const truffleAssert = require("truffle-assertions")

const BN = web3.utils.BN
const toWei = web3.utils.toWei
const fromWei = web3.utils.fromWei

const MultisigRDA = artifacts.require("MultisigRDA")
const gemLike = artifacts.require("GemLike")

// testchain addresses
const daiAddress = "0x8d68d36d45a34a6ff368069bd0baa32ad49a6092"

const toEth = (wei) => fromWei(wei.toString(), "ether")


/** -- Story --
 * The rent contract is terminated before the accrued interest exceeds the fee:
 * 1. The tenant transfers the deposits and starts the contract
 * 2. After a while, the rent period ends, the deposit is returned to the tenant
 * 3. The trustee's fee remains on the contract. The tenant will try to steal it.
 * 4. The trustee withdraws his full fee
 *
 * -- Expected Results --
 * Part of the deposit is withheld to pay for the fees and the tenant can't access it.
 * Tenant   : Profit = Interest - Fee (negative)
 * Landlord : Not affected
 * Trustee  : Profit = Fee
 */

contract("Behaviour: Expected", (accounts) => {
  const participants = [accounts[0], accounts[1], accounts[2]]
  const names = ["tenant", "landlord", "trustee"]
  const tenant = participants[0], landlord = participants[1], trustee = participants[2]
  const deposit  = new BN(toWei("1", "ether"))
  const fee  = new BN(toWei("0.01", "ether"))
  let rda, daiToken
  const initialDaiBalances = {}
  const passTime = 1

  it(`Create and deploy contract, send funds and start it`, async () => {
    rda = await MultisigRDA.new(...participants, fee)
    daiToken = await gemLike.at(daiAddress)

    for (let i = 0; i < participants.length; i++) {
      initialDaiBalances[participants[i]] = await daiToken.balanceOf.call(participants[i])
    }

    await daiToken.transfer(rda.address, deposit, {from: tenant})
    await rda.start({from: trustee})

    const dsrBalance = await rda.dsrBalance.call()
    assert.equal(dsrBalance.add(new BN(1)).gte(deposit), true, 'Not enough locked DAI.')
  })

  it(`Some time passes`, async () => {
    await new Promise(resolve => setTimeout(resolve, passTime * 1000))
  })

  it(`Deposit is returned to tenant`, async () => {

    // Submit Transaction
    let result = await rda.submitTransactionReturnDeposit({from: tenant})
    const txnId = result.logs[0].args['txnId']
    truffleAssert.eventEmitted(result, 'Submission', {txnId})
    truffleAssert.eventEmitted(result, 'Confirmation', {sender: tenant, txnId})

    // Confirm Transaction
    result = await rda.confirmTransaction(txnId, {from: trustee})
    truffleAssert.eventEmitted(result, 'Confirmation', {sender: trustee, txnId})

    // Execute Transaction
    result = await rda.executeTransaction(txnId, {from: tenant})
    truffleAssert.eventEmitted(result, 'Execution', {txnId})
    truffleAssert.eventEmitted(result, 'Withdrawal', {initiator: tenant, receiver: tenant})

  })

  it(`Tenant tries to steal fee as interest and fails`, async () => {
    const balance = await daiToken.balanceOf.call(tenant)
    const result = await rda.withdrawInterest({from: tenant})
    const gained = (await daiToken.balanceOf.call(tenant)).sub(balance)
    truffleAssert.eventNotEmitted(result, 'Withdrawal')
    assert.equal(gained.toString(), "0", 'Tenant should not be able to withdraw locked fee.')
  })

  it(`Trustee withdraws his fee`, async () => {
    const balance = await daiToken.balanceOf.call(trustee)
    const result = await rda.withdrawTrusteeFee({from: trustee})
    const gained = (await daiToken.balanceOf.call(trustee)).sub(balance)
    truffleAssert.eventEmitted(result, 'Withdrawal', {initiator: trustee, receiver: trustee})
    assert.equal(gained.toString(), fee.toString(), 'Incorrect fee withdrawn.')
  })

  it(`Verify all positions`, async () => {
    // Contract
    const rdaBalance = await daiToken.balanceOf.call(rda.address)
    const dsrBalance = await rda.dsrBalance.call()

    console.log("       RDA Balance : ", toEth(rdaBalance))
    console.log("       DSR Balance : ", toEth(dsrBalance))

    assert.equal(rdaBalance.toString(), "0", "Contract should be empty.")
    assert.equal(dsrBalance.toString(), "0", "Contract should be empty.")

    // Participants
    const gains = []
    for (let i = 0; i < participants.length; i++) {
      gains[participants[i]] =
        (await daiToken.balanceOf.call(participants[i])).sub(initialDaiBalances[participants[i]])
      console.log(`       ${names[i]} gains : ${toEth(gains[participants[i]])}`)
    }

    assert(gains[tenant].lt(new BN(0)), true, "Tenant should have some losses since fee > interest.")
    assert(gains[landlord].toString(), "0", "Landlord should not be affected at all.")
    assert(gains[trustee].toString(), fee.toString(), "Trustee should gain the fee exactly.")

  })

})