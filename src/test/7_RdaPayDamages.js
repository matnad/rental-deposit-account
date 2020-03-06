const truffleAssert = require("truffle-assertions")

const BN = web3.utils.BN
const toWei = web3.utils.toWei
const fromWei = web3.utils.fromWei

const MultisigRDA = artifacts.require("MultisigRDA")
const GemLike = artifacts.require("GemLike")

// testchain addresses
const daiAddress = "0x8d68d36d45a34a6ff368069bd0baa32ad49a6092"

const toEth = (wei) => fromWei(wei.toString(), "ether")

contract("MultisigRDA: Return Deposit", (accounts) => {
  const participants = [accounts[0], accounts[1], accounts[2]]
  const multisigRDA = []
  const nContracts = 2
  const weiFee = [
    new BN(toWei("0.01", "ether")),
    new BN(toWei("0.01", "ether")),
    new BN(toWei("0.1", "ether")),
    new BN(toWei("0.01", "ether")),
  ]
  const weiDeposit = [
    new BN(toWei("0.1", "ether")),
    new BN(toWei("0.1", "ether")),
    new BN(toWei("0.01", "ether")),
    new BN(toWei("0.005", "ether")),
  ]

  it(`setup contracts with deposits`, async () => {
    const daiToken = await GemLike.at(daiAddress)
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

  it(`C0:: pay damages equal to half the deposit amount`, async () => {
    const contract = 0
    const rda = multisigRDA[contract]
    const daiToken = await GemLike.at(daiAddress)

    const initialLandlordDaiBalance = await daiToken.balanceOf.call(participants[1])
    const result = await rda.submitTransactionPayDamages((weiDeposit[contract] / 2).toString(), {from: participants[1]})
    const txnId = result.logs[0].args['txnId']
    await rda.confirmTransaction(txnId, {from: participants[2]})
    const result2 = await rda.executeTransaction(txnId, {from: participants[1]})
    truffleAssert.eventEmitted(result2, 'Execution', { txnId })
    const gained = (await daiToken.balanceOf.call(participants[1])).sub(initialLandlordDaiBalance)
    const RDABalanceRemaining = await daiToken.balanceOf.call(rda.address)
    const RDADSRBalance = await rda.dsrBalance.call({from: participants[1]})
    const damagesPaid = await rda.landlordDamagesPaid.call({from: participants[1]})
    console.log("       Initial Deposit  : ", toEth(weiDeposit[contract]))
    console.log("       Landlord gained  : ", toEth(gained))
    console.log("       Damages Paid     : ", toEth(damagesPaid))
    console.log("       Remaining Balance: ", toEth(RDABalanceRemaining))
    console.log("       Remaining DSR    : ", toEth(RDADSRBalance))
    assert.equal(gained.toString(), (weiDeposit[contract] / 2).toString(),  'Not enough withdrawn.')
    assert.equal(damagesPaid.toString(), gained.toString(), 'Damages paid should be updated in the contract.')
    assert.equal(RDABalanceRemaining.toString(), "0", "Contract should have no balance.")
    assert.equal(RDADSRBalance.gte((weiDeposit[contract] / 2).toString()), true, 'DSR balance too low.')
  })

  it(`C0:: Try to withdraw the full deposit amount (double of what is allowed)`, async () => {
    const contract = 0
    const rda = multisigRDA[contract]
    const daiToken = await GemLike.at(daiAddress)

    const initialLandlordDaiBalance = await daiToken.balanceOf.call(participants[1])
    const initialDamagesPaid = await rda.landlordDamagesPaid.call({from: participants[1]})
    const result = await rda.submitTransactionPayDamages(weiDeposit[contract].toString(), {from: participants[1]})
    const txnId = result.logs[0].args['txnId']
    await rda.confirmTransaction(txnId, {from: participants[2]})
    const result2 = await rda.executeTransaction(txnId, {from: participants[1]})
    truffleAssert.eventEmitted(result2, 'Execution', { txnId })
    const gained = (await daiToken.balanceOf.call(participants[1])).sub(initialLandlordDaiBalance)
    const RDABalanceRemaining = await daiToken.balanceOf.call(rda.address)
    const RDADSRBalance = await rda.dsrBalance.call({from: participants[1]})
    const damagesPaid = await rda.landlordDamagesPaid.call({from: participants[1]})
    console.log("       Initial Deposit     : ", toEth(weiDeposit[contract]))
    console.log("       Initial Damages Paid: ", toEth(initialDamagesPaid))
    console.log("       Landlord gained     : ", toEth(gained))
    console.log("       Total Damages Paid        : ", toEth(damagesPaid))
    console.log("       Remaining Balance   : ", toEth(RDABalanceRemaining))
    console.log("       Remaining DSR       : ", toEth(RDADSRBalance))
    assert.equal(gained.toString(), (weiDeposit[contract] / 2).toString(),  'Wrong amount withdrawn.')
    assert.equal(damagesPaid.toString(), (weiDeposit[contract]).toString(), 'Damages paid should be updated in the contract.')
    assert.equal(RDABalanceRemaining.toString(), "0", "Contract should have no balance.")
    assert.equal(RDADSRBalance.gte(new BN(0)), true, 'DSR balance too low.')
  })

  it(`C1:: Send some DAI to the contract before trying to withdraw full deposit.`, async () => {
    const contract = 1
    const rda = multisigRDA[contract]
    const daiToken = await GemLike.at(daiAddress)

    await daiToken.transfer(rda.address, (weiDeposit[contract] / 5).toString(), {from: participants[0]})
    const initialLandlordDaiBalance = await daiToken.balanceOf.call(participants[1])
    const initialDamagesPaid = await rda.landlordDamagesPaid.call({from: participants[1]})
    const initialRDABalance = await daiToken.balanceOf.call(rda.address)
    const result = await rda.submitTransactionPayDamages(weiDeposit[contract].toString(), {from: participants[1]})
    const txnId = result.logs[0].args['txnId']
    await rda.confirmTransaction(txnId, {from: participants[2]})
    const result2 = await rda.executeTransaction(txnId, {from: participants[1]})
    truffleAssert.eventEmitted(result2, 'Execution', { txnId })
    const gained = (await daiToken.balanceOf.call(participants[1])).sub(initialLandlordDaiBalance)
    const RDABalanceRemaining = await daiToken.balanceOf.call(rda.address)
    const RDADSRBalance = await rda.dsrBalance.call({from: participants[1]})
    const damagesPaid = await rda.landlordDamagesPaid.call({from: participants[1]})
    console.log("       Initial Deposit     : ", toEth(weiDeposit[contract]))
    console.log("       Initial Damages Paid: ", toEth(initialDamagesPaid))
    console.log("       Initial Balance     : ", toEth(initialRDABalance))
    console.log("       Landlord gained     : ", toEth(gained))
    console.log("       Total Damages Paid  : ", toEth(damagesPaid))
    console.log("       Remaining Balance   : ", toEth(RDABalanceRemaining))
    console.log("       Remaining DSR       : ", toEth(RDADSRBalance))
    assert.equal(gained.toString(), weiDeposit[contract].toString(),  'Wrong amount withdrawn.')
    assert.equal(damagesPaid.toString(), (weiDeposit[contract]).toString(), 'Damages paid should be updated in the contract.')
    assert.equal(RDABalanceRemaining.toString(), "0", "Contract should have no balance.")
    assert.equal(RDADSRBalance.gte(weiDeposit[contract] / 5), true, 'DSR balance too low.')
  })


})
