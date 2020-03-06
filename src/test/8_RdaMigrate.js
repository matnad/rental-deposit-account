const truffleAssert = require("truffle-assertions")

const BN = web3.utils.BN
const toWei = web3.utils.toWei
const fromWei = web3.utils.fromWei

const MultisigRDA = artifacts.require("MultisigRDA")
const GemLike = artifacts.require("GemLike")

// testchain addresses
const daiAddress = "0x8d68d36d45a34a6ff368069bd0baa32ad49a6092"

const toEth = (wei) => fromWei(wei.toString(), "ether")

contract("MultisigRDA: Migrate", (accounts) => {
  const participants = [accounts[0], accounts[1], accounts[2]]
  const multisigRDA = []
  const nContracts = 2
  const weiFee = [
    new BN(toWei("0.01", "ether")),
    new BN(toWei("0.01", "ether")),
  ]
  const weiDeposit = [
    new BN(toWei("0.1", "ether")),
    new BN(toWei("0.1", "ether")),
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

  it(`C0:: migrate to a new RDA contract and start it`, async () => {
    const contract = 0
    const rda = multisigRDA[contract]
    const daiToken = await GemLike.at(daiAddress)

    // deploy new contract
    const newRda = await MultisigRDA.new(...participants, weiFee[contract])

    const initialDsrBalance = await rda.dsrBalance.call({from: participants[2]})
    const initialRdaBalance = await daiToken.balanceOf.call(rda.address)
    const result = await rda.submitTransactionMigrate(newRda.address, {from: participants[0]})
    const txnId = result.logs[0].args['txnId']
    await rda.confirmTransaction(txnId, {from: participants[2]}) // must be confirmed by trustee
    const result2 = await rda.executeTransaction(txnId, {from: participants[2]})
    truffleAssert.eventEmitted(result2, 'Execution', { txnId })
    await newRda.start({from: participants[2]})
    const rdaBalanceRemaining = await daiToken.balanceOf.call(rda.address)
    const dsrBalanceRemaining = await rda.dsrBalance.call({from: participants[2]})
    const newRDABalance = await daiToken.balanceOf.call(newRda.address)
    const newDSRBalance = await newRda.dsrBalance.call({from: participants[2]})
    console.log("       Initial Balance  : ", toEth(initialRdaBalance))
    console.log("       Initial DSR      : ", toEth(initialDsrBalance))
    console.log("       Remaining Balance: ", toEth(rdaBalanceRemaining))
    console.log("       Remaining DSR    : ", toEth(dsrBalanceRemaining))
    console.log("       New Balance      : ", toEth(newRDABalance))
    console.log("       New DSR          : ", toEth(newDSRBalance))
    assert.equal(rdaBalanceRemaining.toString(), "0",  'Old balance should be empty.')
    assert.equal(dsrBalanceRemaining.toString(), "0",  'Old DSR should be empty.')
    assert.equal(newRDABalance.toString(), "0",  'New balance should be joined.')
    assert.equal(newDSRBalance.gte(initialDsrBalance), true,  'New DSR should be greater than or equal to the old.')
  })

  it(`C1:: migrate to a private address`, async () => {
    const contract = 1
    const dest = accounts[5]
    const rda = multisigRDA[contract]
    const daiToken = await GemLike.at(daiAddress)

    const initialDsrBalance = await rda.dsrBalance.call({from: participants[2]})
    const initialDestBalance = await daiToken.balanceOf.call(dest)
    const result = await rda.submitTransactionMigrate(dest, {from: participants[0]})
    const txnId = result.logs[0].args['txnId']
    await rda.confirmTransaction(txnId, {from: participants[2]}) // must be confirmed by trustee
    const result2 = await rda.executeTransaction(txnId, {from: participants[2]})
    truffleAssert.eventEmitted(result2, 'Execution', { txnId })
    const dsrBalanceRemaining = await rda.dsrBalance.call({from: participants[2]})
    const gained = (await daiToken.balanceOf.call(dest)).sub(initialDestBalance)
    console.log("       Initial DSR      : ", toEth(initialDsrBalance))
    console.log("       Remaining DSR    : ", toEth(dsrBalanceRemaining))
    console.log("       Dest Gained      : ", toEth(gained))
    assert.equal(dsrBalanceRemaining.toString(), "0",  'Old DSR should be empty.')
    assert.equal(gained.gte(initialDsrBalance), true,  'New balance should be at least old amount.')
  })


})
