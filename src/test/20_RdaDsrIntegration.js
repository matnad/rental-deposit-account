const BN = web3.utils.BN
const toWei = web3.utils.toWei
const fromWei = web3.utils.fromWei
const RAY = Math.pow(10, 27)

const MultisigRDA = artifacts.require("MultisigRDA")
const gemLike = artifacts.require("GemLike")

// testchain addresses
const daiAddress = "0x8d68d36d45a34a6ff368069bd0baa32ad49a6092"

contract("MultisigRDA: DSR", (accounts) => {
  const acc = accounts[0]
  const lockAsDai = 0.1 // amount of dai to lock and unlock
  const lockAmount = new BN(toWei(lockAsDai.toString(), "ether"))


  it(`assure ${lockAsDai} DAI is owned by acc0`, async () => {
    const daiToken = await gemLike.at(daiAddress)

    let daiBalance = fromWei((await daiToken.balanceOf.call(acc)).toString(), "ether")
    console.log("        DAI balance: ", daiBalance)

    assert.equal(daiBalance >= lockAsDai, true,
      `Need ${lockAsDai} or more DAI, but got ${daiBalance.toString()}`)
  })

  it(`transfer ${lockAsDai} dai to RDA contract`, async () => {
    const daiToken = await gemLike.at(daiAddress)
    const multisigRDA = await MultisigRDA.deployed()

    await daiToken.transfer(multisigRDA.address, lockAmount.toString(), {from: acc})
    const balance = await daiToken.balanceOf.call(multisigRDA.address)

    assert.equal(balance.toString(), lockAmount.toString(), `wrong amount of DAI on RDA contract`)
  })

  it(`start the RDA contract`, async () => {
    const daiToken = await gemLike.at(daiAddress)
    const multisigRDA = await MultisigRDA.deployed()

    let dsrBalance = await multisigRDA.dsrBalance.call()
    console.log("       DSR Balance: ", fromWei(dsrBalance.toString(), "ether"))

    console.log("       Locking Dai...")
    multisigRDA.start({from: acc})

    assert.equal(await daiToken.balanceOf.call(multisigRDA.address), 0, `RDA should have no DAI left`)

    dsrBalance = await multisigRDA.dsrBalance.call()
    console.log("       DSR Balance: ", fromWei(dsrBalance.toString(), "ether"))

    // Round up before comparing
    assert.equal((dsrBalance + 1).toString() >= lockAmount.toString(), true, 'not enough DAI locked')
  })

})