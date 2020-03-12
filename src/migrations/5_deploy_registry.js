const Registry = artifacts.require("RDARegistry");

module.exports = function(deployer, _, accounts) {
  deployer.deploy(Registry);
};