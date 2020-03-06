const Maker = require('@makerdao/dai')
const McdPlugin = require('@makerdao/dai-plugin-mcd').default
const ETH = require('@makerdao/dai-plugin-mcd').ETH
const MDAI = require('@makerdao/dai-plugin-mcd').MDAI
require('dotenv').config();

const BN = web3.utils.BN;
const toWei = web3.utils.toWei;
const fromWei = web3.utils.fromWei;

const gemLike = artifacts.require("GemLike");

contract('Set Up Dai', (accounts) => {
  const acc = accounts[0];
  const targetDai = 200;

  it(`should have at least ${targetDai/2} DAI in account.`, async () => {
    // will draw new dai up to targetDai if it drops below 50% of targetDai
    const maker = await Maker.create('http', {
      url: process.env.RPC_URL,
      plugins: [
        [McdPlugin, {}]
      ]
    })
    await maker.authenticate()

    const daiToken = await gemLike.at("0x8d68d36d45a34a6ff368069bd0baa32ad49a6092");
    let daiBalance = await daiToken.balanceOf.call(acc);
    console.log("DAI balance: ", fromWei(daiBalance.toString(), "ether"));
    const targetDaiBN = new BN(toWei(targetDai.toString(), "ether"));
    if (daiBalance < targetDaiBN / 2) {
      const toAcquire = targetDaiBN - daiBalance;
      const toAcquireNr = fromWei(toAcquire.toString(), "ether");
      console.log("Not enough DAI. Opening Vault...");

      const cdp = await maker
        .service('mcd:cdpManager')
        .openLockAndDraw('ETH-A', ETH(Math.floor(toAcquireNr/10)), MDAI(toAcquireNr));

      console.log('Opened CDP #'+cdp.id);
      console.log('Collateral amount: '+cdp.collateralAmount.toString());
      console.log('Debt Value: '+cdp.debtValue.toString());

      daiBalance = await daiToken.balanceOf.call(acc);
    }

    assert.equal(daiBalance.toString() >=  (targetDaiBN/2).toString(), true,
      `Need ${targetDaiBN/2} or more DAI, but got ${daiBalance.toString()}`);
  });
});