const truffleAssert = require("truffle-assertions")

const BN = web3.utils.BN
const toWei = web3.utils.toWei
const fromWei = web3.utils.fromWei

const MultisigRDA = artifacts.require("MultisigRDA")
const GemLike = artifacts.require("GemLike")

// testchain addresses
const daiAddress = "0x8d68d36d45a34a6ff368069bd0baa32ad49a6092"

const toEth = (wei) => fromWei(wei.toString(), "ether")
const toMwei = (wei) => fromWei(wei.toString(), "mwei")

contract("MultisigRDA: Withdraw Interest", (accounts) => {
  const participants = [accounts[0], accounts[1], accounts[2]]
  const multisigRDA = []
  const nContracts = 4
  const weiDeposit = [
    new BN(toWei("0.1", "ether")),
    new BN(toWei("0.1", "ether")),
    new BN(toWei("0.1", "ether")),
    new BN(toWei("0.1", "ether")),
  ]
  const weiFee = [
    new BN(toWei("0.01", "ether")),
    new BN(toWei("1", "mwei")),
    new BN(toWei("1", "mwei")),
    new BN(toWei("1", "mwei")),
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

  it(`C0:: try to withdraw interest before the fee interest is accumulated`, async () => {
    const contract = 0
    const rda = multisigRDA[contract]
    const daiToken = await GemLike.at(daiAddress)

    const initialTenantBalance = await daiToken.balanceOf.call(participants[0])
    const result = await rda.withdrawInterest({from: participants[0]})
    const gained = initialTenantBalance.sub(await daiToken.balanceOf.call(participants[0]))
    console.log("       Tenant gained : ", toEth(gained))
    truffleAssert.eventNotEmitted(result, 'Withdrawal')
    assert.equal(gained.toString(), "0",  'Nothing should be transferred.')
  })

  it(`C1:: withdraw interest after fee is accumulated`, async () => {
    const contract = 1
    const rda = multisigRDA[contract]
    const daiToken = await GemLike.at(daiAddress)

    const initialTenantBalance = await daiToken.balanceOf.call(participants[0])
    const result = await rda.withdrawInterest({from: participants[0]})
    const dsrBalance = await rda.dsrBalance.call()
    const gained = (await daiToken.balanceOf.call(participants[0])).sub(initialTenantBalance)
    const rdaBalance = await daiToken.balanceOf.call(rda.address)
    console.log("       Tenant gained (Mwei): ", toMwei(gained))
    console.log("       RDA Balance (Mwei)  : ", toMwei(rdaBalance))
    console.log("       DSR Balance (Dai)   : ", toEth(dsrBalance))
    truffleAssert.eventEmitted(result, 'Withdrawal', {initiator: participants[0], receiver: participants[0]})
    assert.equal(gained.gte(new BN(0)), true,  'Withdraw should be positive.')
    assert.equal(rdaBalance.toString(), "0",  'No floating balance.')
    assert.equal(
      dsrBalance.add(new BN(1)).gte(weiDeposit[contract].add(weiFee[contract])), // round up
      true,
      'Locked dai should be at least deposit + fee'
    )
  })

  it(`C2:: pay some damages, then withdraw interest after fee is accumulated`, async () => {
    const contract = 2
    const rda = multisigRDA[contract]
    const daiToken = await GemLike.at(daiAddress)

    let result = await rda.submitTransactionPayDamages((weiDeposit[contract] / 5).toString(), {from: participants[1]})
    const txnId = result.logs[0].args['txnId']
    await rda.confirmTransaction(txnId, {from: participants[2]})
    await rda.executeTransaction(txnId, {from: participants[1]})
    const initialTenantBalance = await daiToken.balanceOf.call(participants[0])
    result = await rda.withdrawInterest({from: participants[0]})
    const dsrBalance = await rda.dsrBalance.call()
    const gained = (await daiToken.balanceOf.call(participants[0])).sub(initialTenantBalance)
    const damagesPaid = await rda.landlordDamagePaid.call()
    const rdaBalance = await daiToken.balanceOf.call(rda.address)
    console.log("       Tenant gained (Mwei): ", toMwei(gained))
    console.log("       RDA Balance (Mwei)  : ", toMwei(rdaBalance))
    console.log("       DamagesPaid (Dai)  : ", toEth(damagesPaid))
    console.log("       DSR Balance (Dai)   : ", toEth(dsrBalance))
    truffleAssert.eventEmitted(result, 'Withdrawal', {initiator: participants[0], receiver: participants[0]})
    assert.equal(gained.gte(new BN(0)), true,  'Withdraw should be positive.')
    assert.equal(rdaBalance.toString(), "0",  'No floating balance.')
    assert.equal(
      dsrBalance.add(new BN(1)).gte(weiDeposit[contract].add(weiFee[contract]).sub(damagesPaid)), // round up
      true,
      'Locked dai should be at least deposit + fee - damagesPaid'
    )
  })

  it(`C3:: pay some damages, withdraw fee, then withdraw interest `, async () => {
    const contract = 3
    const rda = multisigRDA[contract]
    const daiToken = await GemLike.at(daiAddress)

    await rda.withdrawTrusteeFee({from: participants[2]})
    let result = await rda.submitTransactionPayDamages((weiDeposit[contract] / 2).toString(), {from: participants[1]})
    const txnId = result.logs[0].args['txnId']
    await rda.confirmTransaction(txnId, {from: participants[2]})
    await rda.executeTransaction(txnId, {from: participants[1]})
    const initialTenantBalance = await daiToken.balanceOf.call(participants[0])
    result = await rda.withdrawInterest({from: participants[0]})
    const dsrBalance = await rda.dsrBalance.call()
    const gained = (await daiToken.balanceOf.call(participants[0])).sub(initialTenantBalance)
    const damagesPaid = await rda.landlordDamagePaid.call()
    const rdaBalance = await daiToken.balanceOf.call(rda.address)
    const feePaid = await rda.trusteeFeePaid.call()
    console.log("       Tenant gained (Mwei): ", toMwei(gained))
    console.log("       RDA Balance (Mwei)  : ", toMwei(rdaBalance))
    console.log("       Damages Paid (Dai)  : ", toEth(damagesPaid))
    console.log("       Fee Paid (Mwei)     : ", toMwei(feePaid))
    console.log("       DSR Balance (Dai)   : ", toEth(dsrBalance))
    truffleAssert.eventEmitted(result, 'Withdrawal', {initiator: participants[0], receiver: participants[0]})
    assert.equal(gained.gte(new BN(0)), true,  'Withdraw should be positive.')
    assert.equal(rdaBalance.toString(), "0",  'No floating balance.')
    assert.equal(
      dsrBalance.add(new BN(1)).gte(weiDeposit[contract].add(weiFee[contract].sub(feePaid)).sub(damagesPaid)), // round up
      true,
      'Locked dai should be at least deposit + fee - feePaid - damagesPaid'
    )
  })

})