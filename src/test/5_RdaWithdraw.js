const truffleAssert = require("truffle-assertions")

const BN = web3.utils.BN
const toWei = web3.utils.toWei
const fromWei = web3.utils.fromWei

const MultisigRDA = artifacts.require("MultisigRDA")
const Dai = artifacts.require("Dai")

// testchain addresses
const daiAddress = "0x8d68d36d45a34a6ff368069bd0baa32ad49a6092"

const toEth = (wei) => fromWei(wei.toString(), "ether")
const toGwei = (wei) => fromWei(wei.toString(), "gwei")
const toMwei = (wei) => fromWei(wei.toString(), "mwei")


contract("MultisigRDA: Withdraws", (accounts) => {
  const participants = [accounts[0], accounts[1], accounts[2]]
  const lockAsDai = 0.1 // amount of dai to lock and unlock per contract
  const lockAmount = new BN(toWei(lockAsDai.toString(), "ether"))
  const multisigRDA = []
  const nContracts = 4
  const weiFee = [
    4 * Math.pow(10, 8), // modify this to get more or less loops in test 3
    Math.pow(10, 8),
    Math.pow(10, 8),
    Math.pow(10, 11),
  ]


  it(`setup contracts with deposits`, async () => {
    const daiToken = await Dai.at(daiAddress)

    let daiBalance = fromWei((await daiToken.balanceOf.call(participants[0])).toString(), "ether")
    assert.equal(daiBalance > lockAsDai * nContracts, true,
      `Need ${lockAsDai * 5} or more DAI, but got ${daiBalance.toString()}`)

    for (let i = 0; i < nContracts; i++) {
      multisigRDA[i] = await MultisigRDA.new(...participants, weiFee[i])

      await daiToken.transfer(multisigRDA[i].address, lockAmount.toString(), {from: participants[0]})
      await multisigRDA[i].start({from: participants[0]})

      const dsrBalance = await multisigRDA[i].dsrBalance.call()
      assert.equal((dsrBalance + 1) >= lockAmount, true, `not enough DAI locked in contract ${i}`)
      console.log(`     Created Contract ${i} with a fee of ${toMwei(weiFee[i])} Mwei Dai.`)
    }
  })


  it(`C0:: try to withdraw fee to the trustee`, async () => {
    const contract = 0
    const daiToken = await Dai.at(daiAddress)
    const rda = multisigRDA[contract]
    const paid = await rda.trusteeFeePaid.call()
    const remain = weiFee[contract] - paid
    console.log("       Remaining Fee (Mwei) : ", toMwei(remain))
    const initialTrusteeBalance = await daiToken.balanceOf(participants[2])
    const result = await rda.withdrawTrusteeFee({from: participants[2]})
    const trusteeBalance = await daiToken.balanceOf(participants[2])
    const gained = trusteeBalance - initialTrusteeBalance
    truffleAssert.eventEmitted(
      result,
      'Withdrawal',
      {initiator: participants[2], receiver: participants[2]}
    )
    console.log("       Withdraw gained (Mwei): ", toMwei(gained))
    assert.equal(gained > 0 , true, 'could not withdraw any dai')

  })

  it(`C0:: wait and withdraw until fee is covered`, async () => {
    const contract = 0
    const daiToken = await Dai.at(daiAddress)
    const rda = multisigRDA[contract]
    let paid = await rda.trusteeFeePaid.call()
    let remain = weiFee[contract] - paid
    while (remain > 0) {
      console.log("       Remaining Fee (Mwei) : ", toMwei(remain))
      const initialTrusteeBalance = await daiToken.balanceOf(participants[2])
      await rda.withdrawTrusteeFee({from: participants[2]})
      const trusteeBalance = await daiToken.balanceOf(participants[2])
      const gained = trusteeBalance - initialTrusteeBalance
      console.log("       Withdraw gained (Mwei): ", toMwei(gained))
      await new Promise(resolve => setTimeout(resolve, 1000))
      paid = await rda.trusteeFeePaid.call()
      remain = weiFee[contract] - paid
    }
  })

  it(`C1:: should have enough to withdraw in one step`, async () => {
    const contract = 1
    const daiToken = await Dai.at(daiAddress)
    const rda = multisigRDA[contract]
    let paid = await rda.trusteeFeePaid.call()
    let remain = weiFee[contract] - paid
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log("       Remaining Fee (Mwei) : ", toMwei(remain))
    const initialTrusteeBalance = await daiToken.balanceOf(participants[2])
    await rda.withdrawTrusteeFee({from: participants[2]})
    const remainingInterest = await rda.currentInterest.call()
    const trusteeBalance = await daiToken.balanceOf(participants[2])
    const gained = trusteeBalance - initialTrusteeBalance
    console.log("       Withdraw gained (Mwei): ", toMwei(gained))
    console.log("       Left   interest (Mwei): ", toMwei(remainingInterest))
    assert.equal(remainingInterest.gt(0), true, 'could not withdraw in one step')
  })

  it(`C2:: send enough dai to contract to cover the fee`, async () => {
    const contract = 2
    const daiToken = await Dai.at(daiAddress)
    const rda = multisigRDA[contract]
    let paid = await rda.trusteeFeePaid.call()
    let remain = weiFee[contract] - paid
    await daiToken.transfer(rda.address, 2 * weiFee[contract], {from: participants[0]})
    let daiBalance = await daiToken.balanceOf.call(rda.address)
    console.log("       Dai (Mwei) on RDA    : ", toMwei(daiBalance))
    assert.equal(daiBalance, 2 * weiFee[contract], 'wrong balance')
    console.log("       Remaining Fee (Mwei) : ", toMwei(remain))
    const initialTrusteeBalance = await daiToken.balanceOf(participants[2])
    await rda.withdrawTrusteeFee({from: participants[2]})
    const remainingInterest = await rda.currentInterest.call()
    const trusteeBalance = await daiToken.balanceOf(participants[2])
    const gained = trusteeBalance - initialTrusteeBalance
    console.log("       Withdraw gained (Mwei): ", toMwei(gained))
    assert.equal(gained, weiFee[contract], 'wrong withdraw amount')
    console.log("       Left   interest (Mwei): ", toMwei(remainingInterest))
    daiBalance = await daiToken.balanceOf.call(rda.address)
    console.log("       Dai (Mwei) on RDA    : ", toMwei(daiBalance))
    assert.equal(daiBalance, weiFee[contract], 'wrong balance left')
  })

  it(`C3:: set fee high and send a bit less dai to force a split from balance and withdraw`, async () => {
    const contract = 3
    const daiToken = await Dai.at(daiAddress)
    const rda = multisigRDA[contract]
    let paid = await rda.trusteeFeePaid.call()
    let remain = weiFee[contract] - paid
    // send all but 200 Mwei
    await daiToken.transfer(rda.address, weiFee[contract] - 300 * Math.pow(10,6), {from: participants[0]})
    let daiBalance = await daiToken.balanceOf.call(rda.address)
    console.log("       Dai on RDA (Gwei)      : ", toGwei(daiBalance))
    console.log("       Remaining Fee (Gwei)   : ", toGwei(remain))
    const previousInterest = await rda.currentInterest.call()
    console.log("       Current interest (Gwei): ", toGwei(previousInterest))
    const initialTrusteeBalance = await daiToken.balanceOf(participants[2])
    await rda.withdrawTrusteeFee({from: participants[2]})
    const remainingInterest = await rda.currentInterest.call()
    const trusteeBalance = await daiToken.balanceOf(participants[2])
    const gained = trusteeBalance - initialTrusteeBalance
    console.log("       Withdraw gained (Gwei): ", toGwei(gained))
    console.log("       Remaining interest (Gwei): ", toGwei(remainingInterest))
    assert.equal(remainingInterest.lt(previousInterest), true, 'accrued interest on DSR should be less than before')
    daiBalance = await daiToken.balanceOf.call(rda.address)
    console.log("       Dai on RDA (Gwei)     : ", toGwei(daiBalance))
    assert.equal(daiBalance, 0, 'wrong balance left')
  })

  it(`test withdraw on contract that is not active`, async () => {
    const rda = await MultisigRDA.new(...participants, 10)
    await truffleAssert.reverts(
      rda.withdrawTrusteeFee({from: participants[2]}),
      "RDA/not-active",
    )
  })

})