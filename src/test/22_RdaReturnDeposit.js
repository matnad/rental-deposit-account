const truffleAssert = require("truffle-assertions")

const BN = web3.utils.BN
const toWei = web3.utils.toWei
const fromWei = web3.utils.fromWei

const MultisigRDA = artifacts.require("MultisigRDA")
const gemLike = artifacts.require("GemLike")

// testchain addresses
const daiAddress = "0x8d68d36d45a34a6ff368069bd0baa32ad49a6092"

const toEth = (wei) => fromWei(wei.toString(), "ether")

/** Notes **
 * ---
 * Current behaviour: No funds transferred (empty contract or locked fee) => Execution (success)
 * Reason: This will close transactions on a "dead" contract.
 * ExecutionFailure is only triggered if the Dai transfer is unsuccessful
 * ---
 * ReturnDeposit() omits a few validations to save ~20k gas on typical executions.
 * => Execution at the wrong times (for example when all DAI has been exited)
 * will waste ~150k gas. Can prevent improper executions with an interface.
 */


contract("MultisigRDA: Return Deposit", (accounts) => {
  const participants = [accounts[0], accounts[1], accounts[2]]
  const multisigRDA = []
  const nContracts = 3
  const weiFee = [
    new BN(toWei("0.01", "ether")),
    new BN(toWei("10", "mwei")),
    new BN(toWei("0.1", "ether")),
    new BN(toWei("0.01", "ether")),
  ]
  const weiDeposit = [
    new BN(toWei("0.1", "ether")),
    new BN(toWei("0.2", "ether")),
    new BN(toWei("0.01", "ether")),
    new BN(toWei("0.005", "ether")),
  ]

  it(`setup contracts with deposits`, async () => {
    const daiToken = await gemLike.at(daiAddress)
    let neededBalance = new BN(0)
    for (let i = 0; i < nContracts; i++) {
      neededBalance.iadd(weiDeposit[i])
    }
    let daiBalance = await daiToken.balanceOf.call(participants[0])
    assert.equal(daiBalance.gte(neededBalance), true,
      `Need ${toEth(neededBalance)} or more DAI, but got ${toEth(daiBalance)}`)
    for (let i = 0; i < nContracts; i++) {
      multisigRDA[i] = await MultisigRDA.new(...participants, weiFee[i])

      await daiToken.transfer(multisigRDA[i].address, weiDeposit[i], {from: participants[0]})
      await multisigRDA[i].start({from: participants[0]})

      const dsrBalance = await multisigRDA[i].dsrBalance.call()
      assert.equal(new BN(dsrBalance + 1).gte(weiDeposit[i]), true, `not enough DAI locked in contract ${i}`)
      console.log(`     Created Contract ${i} with a deposit of ${toEth(weiDeposit[i])} and a fee of ${toEth(weiFee[i])} Dai.`)
    }
  })

  it(`C0:: return deposit with outstanding fee smaller than remaining funds`, async () => {
    const contract = 0
    const rda = multisigRDA[contract]
    const daiToken = await gemLike.at(daiAddress)

    // pay fee from interest
    await new Promise(resolve => setTimeout(resolve, 1000))
    const paidFee = await rda.trusteeFeePaid.call()
    const remainingFee = weiFee[contract].sub(paidFee)

    const initialTenantDaiBalance = await daiToken.balanceOf.call(participants[0])
    const result = await rda.submitTransactionReturnDeposit({from: participants[0]})
    const txnId = result.logs[0].args['txnId']
    await rda.confirmTransaction(txnId, {from: participants[2]})
    const result2 = await rda.executeTransaction(txnId, {from: participants[0]})
    truffleAssert.eventEmitted(result2, 'Execution', { txnId })
    const gained = (await daiToken.balanceOf.call(participants[0])).sub(initialTenantDaiBalance)
    const RDABalanceRemaining = await daiToken.balanceOf.call(rda.address)
    console.log("       Initial Deposit  : ", toEth(weiDeposit[contract]))
    console.log("       Tenant gained    : ", toEth(gained))
    console.log("       Remaining Fee    : ", toEth(remainingFee))
    console.log("       Remaining Balance: ", toEth(RDABalanceRemaining))
    assert.equal(gained.gte(weiDeposit[contract].sub(remainingFee)), true, 'Not enough withdrawn.')
    assert.equal(remainingFee.toString(), RDABalanceRemaining.toString(), 'Wrong balance remaining on the contract.')
    await rda.withdrawTrusteeFee({from: participants[2]})
    const finalBalance = await daiToken.balanceOf.call(rda.address)
    console.log("       Balance after fee withdraw: ", toEth(finalBalance))
    assert.equal(finalBalance.toString(), "0", "Contract should be emtpy")
  })

  it(`C1:: return deposit after fee has been fully paid off`, async () => {
    const contract = 1
    const rda = multisigRDA[contract]
    const daiToken = await gemLike.at(daiAddress)

    await rda.withdrawTrusteeFee({from: participants[2]})
    const paidFee = await rda.trusteeFeePaid.call()
    const remainingFee = weiFee[contract].sub(paidFee)
    const initialTenantDaiBalance = await daiToken.balanceOf.call(participants[0])
    const result = await rda.submitTransactionReturnDeposit({from: participants[0]})
    const txnId = result.logs[0].args['txnId']
    await rda.confirmTransaction(txnId, {from: participants[2]})
    const result2 = await rda.executeTransaction(txnId, {from: participants[0]})
    truffleAssert.eventEmitted(result2, 'Execution', { txnId })
    const gained = (await daiToken.balanceOf.call(participants[0])).sub(initialTenantDaiBalance)
    const RDABalanceRemaining = await daiToken.balanceOf.call(rda.address)
    console.log("       Initial Deposit  : ", toEth(weiDeposit[contract]))
    console.log("       Tenant gained    : ", toEth(gained))
    console.log("       Remaining Fee    : ", toEth(remainingFee))
    console.log("       Remaining Balance: ", toEth(RDABalanceRemaining))
    assert.equal(gained.gte(weiDeposit[contract].sub(remainingFee)), true, 'Not enough withdrawn.')
    assert.equal("0", RDABalanceRemaining.toString(), 'Wrong balance remaining on the contract.')
  })

  it(`C2:: try to return deposit when fee is larger than deposit`, async () => {
    const contract = 2
    const rda = multisigRDA[contract]
    const daiToken = await gemLike.at(daiAddress)

    const paidFee = await rda.trusteeFeePaid.call()
    const remainingFee = weiFee[contract].sub(paidFee)
    const initialTenantDaiBalance = await daiToken.balanceOf.call(participants[0])
    const result = await rda.submitTransactionReturnDeposit({from: participants[0]})
    const txnId = result.logs[0].args['txnId']
    await rda.confirmTransaction(txnId, {from: participants[2]})
    const result2 = await rda.executeTransaction(txnId, {from: participants[0]})
    // ** Assert execution success, even though nothing is transferred **
    truffleAssert.eventEmitted(result2, 'Execution', { txnId })
    const txn = await rda.transactions.call(txnId)
    assert.equal(txn.executed, true, 'Transaction should be executed.')

    const gained = (await daiToken.balanceOf.call(participants[0])).sub(initialTenantDaiBalance)
    const RDABalanceRemaining = await daiToken.balanceOf.call(rda.address)
    console.log("       Initial Deposit  : ", toEth(weiDeposit[contract]))
    console.log("       Tenant gained    : ", toEth(gained))
    console.log("       Remaining Fee    : ", toEth(remainingFee))
    console.log("       Remaining Balance: ", toEth(RDABalanceRemaining))
    assert.equal(gained.gte(weiDeposit[contract].sub(remainingFee)), true, 'Not enough withdrawn.')
    assert.equal(RDABalanceRemaining.gte(weiDeposit[contract]),true, 'Wrong balance remaining on the contract.')
  })

  it(`C2:: try the same thing again (there will be nothing to exit)`, async () => {
    const contract = 2
    const rda = multisigRDA[contract]
    const daiToken = await gemLike.at(daiAddress)

    const paidFee = await rda.trusteeFeePaid.call()
    const remainingFee = weiFee[contract].sub(paidFee)
    const initialTenantDaiBalance = await daiToken.balanceOf.call(participants[0])
    const result = await rda.submitTransactionReturnDeposit({from: participants[0]})
    const txnId = result.logs[0].args['txnId']
    await rda.confirmTransaction(txnId, {from: participants[2]})
    const result2 = await rda.executeTransaction(txnId, {from: participants[0]})
    // ** Assert execution success, even though nothing is transferred **
    truffleAssert.eventEmitted(result2, 'Execution', { txnId })
    const txn = await rda.transactions.call(txnId)
    assert.equal(txn.executed, true, 'Transaction should be executed.')

    const gained = (await daiToken.balanceOf.call(participants[0])).sub(initialTenantDaiBalance)
    const RDABalanceRemaining = await daiToken.balanceOf.call(rda.address)
    console.log("       Initial Deposit  : ", toEth(weiDeposit[contract]))
    console.log("       Tenant gained    : ", toEth(gained))
    console.log("       Remaining Fee    : ", toEth(remainingFee))
    console.log("       Remaining Balance: ", toEth(RDABalanceRemaining))
    assert.equal(gained.gte(weiDeposit[contract].sub(remainingFee)), true, 'Not enough withdrawn.')
    assert.equal(RDABalanceRemaining.gte(weiDeposit[contract]),true, 'Wrong balance remaining on the contract.')
  })



})
