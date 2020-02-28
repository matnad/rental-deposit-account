const BN = web3.utils.BN;
const toWei = web3.utils.toWei;
const fromWei = web3.utils.fromWei;

const DaiSaving = artifacts.require("DaiSaving");
const Dai = artifacts.require("Dai");

contract('DaiSaving', (accounts) => {
  const acc = accounts[0];
  const lockAmount = new BN(toWei("0.5", "ether"))

  it(`assure 0.5 DAI is owned.`, async  () => {
    const dai = await Dai.at("0x8d68d36d45a34a6ff368069bd0baa32ad49a6092")
    let daiBalance = await dai.balanceOf.call(acc)
    console.log("DAI balance: ", fromWei(daiBalance.toString(), "ether"))
    assert.equal(fromWei(daiBalance.toString(), "ether") >=  0.5, true,
      `Need 0.5 or more DAI, but got ${daiBalance.toString()}`)
  })

  it('transfer 0.5 dai to savings contract', async () => {
    const dai = await Dai.at("0x8d68d36d45a34a6ff368069bd0baa32ad49a6092")
    const daiSaving = await DaiSaving.deployed()
    await dai.transfer(daiSaving.address, lockAmount.toString())
    const balance = await dai.balanceOf(daiSaving.address)
    assert.equal(balance.toString(), lockAmount.toString(), `wrong amount of dai on savings contract`)
  })

  it(`lock 0.5 DAI in the Pot.`, async () => {
    // will draw new dai up to targetDai if it drops below 50% of targetDai
    const dai = await Dai.at("0x8d68d36d45a34a6ff368069bd0baa32ad49a6092")
    const daiSaving = await DaiSaving.deployed()

    let daiBalance = await dai.balanceOf.call(acc)
    console.log("DAI balance: ", fromWei(daiBalance.toString(), "ether"))

    const tx = await daiSaving.join(lockAmount.toString())
    console.log(tx)
  });
});