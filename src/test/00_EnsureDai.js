const Maker = require('@makerdao/dai')
const McdPlugin = require('@makerdao/dai-plugin-mcd').default
const ETH = require('@makerdao/dai-plugin-mcd').ETH
const MDAI = require('@makerdao/dai-plugin-mcd').MDAI
require('dotenv').config()

const BN = web3.utils.BN
const toWei = web3.utils.toWei
const fromWei = web3.utils.fromWei

const gemLike = artifacts.require("GemLike")

const fundAddresses = [
  "0x4103cCB8921fE17EC14Bc7e76346c9F5c0A7396A",
  "0x2E2E6ba103955388E7867883ac93dC2EbfD5FA39",
  "0x4222583E1a3A2D7a3BC8a2417c4Dd8DAd574f145"
]

contract('Set Up Dai', (accounts) => {
  const acc = accounts[0]
  const targetDai = 200

  it(`should have at least ${targetDai / 2} DAI in account.`, async () => {
    // will draw new dai up to targetDai if it drops below 50% of targetDai
    const maker = await Maker.create('http', {
      url: process.env.RPC_URL,
      plugins: [
        [McdPlugin, {}]
      ]
    })
    await maker.authenticate()

    const daiToken = await gemLike.at("0x8d68d36d45a34a6ff368069bd0baa32ad49a6092")
    let daiBalance = await daiToken.balanceOf.call(acc)
    console.log("DAI balance: ", fromWei(daiBalance.toString(), "ether"))
    const targetDaiBN = new BN(toWei(targetDai.toString(), "ether"))
    if (daiBalance < targetDaiBN / 2) {
      const toAcquire = targetDaiBN - daiBalance
      const toAcquireNr = fromWei(toAcquire.toString(), "ether")
      console.log("Not enough DAI. Opening Vault...")

      const cdp = await maker
        .service('mcd:cdpManager')
        .openLockAndDraw('ETH-A', ETH(Math.floor(toAcquireNr / 10)), MDAI(toAcquireNr))

      console.log('Opened CDP #' + cdp.id)
      console.log('Collateral amount: ' + cdp.collateralAmount.toString())
      console.log('Debt Value: ' + cdp.debtValue.toString())

      daiBalance = await daiToken.balanceOf.call(acc)
    }

    assert.equal(daiBalance.toString() >= (targetDaiBN / 2).toString(), true,
      `Need ${targetDaiBN / 2} or more DAI, but got ${daiBalance.toString()}`)

    // fund other addresses from kovan wallet to also work on private net
    const eth10 = new BN(toWei("10", "ether"))
    for (let i = 0; i < fundAddresses.length; i++) {
      const addr = fundAddresses[i]
      let ethBalance = await web3.eth.getBalance(addr)
      if (new BN(ethBalance).lt(eth10)) {
        await web3.eth.sendTransaction({from: accounts[11], to: addr, value: eth10.mul(new BN("2"))})
      }
      let daiBalance = await daiToken.balanceOf.call(addr)
      if (i === 0 && new BN(daiBalance).lt(new BN(toWei("20", "ether")))) {
        await daiToken.transfer(addr, toWei("90", "ether"), {from: acc})
      }
    }
  })
})