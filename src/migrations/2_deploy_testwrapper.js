const TestWrapperDaiSaving = artifacts.require("TestWrapperDaiSaving");

module.exports = function(deployer) {
  deployer.deploy(TestWrapperDaiSaving);
};