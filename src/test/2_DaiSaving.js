// shortform utils
const BN = web3.utils.BN
const toWei = web3.utils.toWei
const fromWei = web3.utils.fromWei

// import artifacts
const DaiSaving = artifacts.require("TestWrapperDaiSaving")
const Dai = artifacts.require("Dai")

// testchain addresses
const daiAddress = "0x8d68d36d45a34a6ff368069bd0baa32ad49a6092"

contract('DaiSaving', (accounts) => {
  const acc = accounts[0]
  const lockAsDai = 0.1 // amount of dai to lock and unlock
  const lockAmount = new BN(toWei(lockAsDai.toString(), "ether"))


  it(`assure ${lockAsDai} DAI is owned.`, async  () => {
    const daiToken = await Dai.at(daiAddress)

    let daiBalance = fromWei((await daiToken.balanceOf.call(acc)).toString(), "ether")
    console.log("        DAI balance: ", daiBalance)

    assert.equal(daiBalance >=  lockAsDai, true,
      `Need ${lockAsDai} or more DAI, but got ${daiBalance.toString()}`)
  })

  it(`transfer ${lockAsDai} dai to savings contract`, async () => {
    const daiToken = await Dai.at(daiAddress)
    const daiSaving = await DaiSaving.deployed()

    await daiToken.transfer(daiSaving.address, lockAmount.toString())
    const balance = await daiToken.balanceOf(daiSaving.address)

    assert.equal(balance.toString(), lockAmount.toString(), `wrong amount of DAI on savings contract`)
  })

  it(`lock ${lockAsDai} DAI in the pot`, async () => {
    // will draw new dai up to targetDai if it drops below 50% of targetDai
    const daiToken = await Dai.at(daiAddress)
    const daiSaving = await DaiSaving.deployed()

    const initialContractBalance = await daiToken.balanceOf(daiSaving.address)
    console.log("       locking DAI...")

    await daiSaving.join_(lockAmount)

    const finalContractBalance = await daiToken.balanceOf(daiSaving.address)
    const lost = initialContractBalance - finalContractBalance
    console.log("       Contract DAI balance decrease: ", fromWei(lost.toString(), "ether"))

    assert.equal(lost.toString(), lockAmount.toString(), `contract should have 0 DAI after locking it`)
  })

  const passTime = 2
  it(`pass ${passTime} seconds of time to accrue interest`, async () => {
    // To accrue some interest on the locked DAI
    await new Promise(resolve => setTimeout(resolve, passTime * 1000))
  })

  it(`exit ${lockAsDai} DAI from the pot`, async () => {
    const daiToken = await Dai.at(daiAddress)
    const daiSaving = await DaiSaving.deployed()

    const initialContractBalance = await daiToken.balanceOf(daiSaving.address)
    console.log("       exiting DAI...")
    await daiSaving.exit_(lockAmount)
    const finalContractBalance = await daiToken.balanceOf(daiSaving.address)
    const gained = finalContractBalance - initialContractBalance

    console.log("       Contract DAI balance increase: ", fromWei(gained.toString(), "ether"))
    assert.equal(gained.toString(), lockAmount.toString(), `contract should have gained ${lockAsDai}` )

  })

  it(`exit all remaining DAI from the pot (interest)`, async () => {
    const daiToken = await Dai.at(daiAddress)
    const daiSaving = await DaiSaving.deployed()

    const initialContractBalance = await daiToken.balanceOf(daiSaving.address)
    console.log("       exiting DAI...")
    await daiSaving.exitAll_()
    const finalContractBalance = await daiToken.balanceOf(daiSaving.address)
    const gained = finalContractBalance - initialContractBalance

    console.log("       Contract DAI balance increase: ", fromWei(gained.toString(), "ether"))
    assert.equal(gained > 0, true, 'should have gained some DAI from interest')
  })
})