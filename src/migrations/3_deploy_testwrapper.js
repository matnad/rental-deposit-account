const TestWrapperSavingDai = artifacts.require("TestWrapperSavingDai");

module.exports = function(deployer) {
  deployer.deploy(TestWrapperSavingDai);
};