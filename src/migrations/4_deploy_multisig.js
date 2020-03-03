const MultisigRDA = artifacts.require("MultisigRDA");

module.exports = function(deployer, _, accounts) {
  deployer.deploy(MultisigRDA, accounts[0], accounts[1], accounts[2]);
};