const toWei = web3.utils.toWei
const fromWei = web3.utils.fromWei

const Multisig = artifacts.require("MultisigRDA")

contract('Multisig', (accounts) => {


  it(`check if contract is properly initialized`, async () => {
    multisig = await Multisig.deployed()
    const accs = await multisig.getAccs.call()
    assert.equal(accs[0], accounts[0], 'acc1 failed to init')
    assert.equal(accs[1], accounts[1], 'acc2 failed to init')
    assert.equal(accs[2], accounts[2], 'acc3 failed to init')
  })

 it(`add a transaction`, async () => {
   multisig = await Multisig.deployed()
   const id = await multisig.addTransaction.call(7, accounts[4], 100)
   await multisig.addTransaction(7, accounts[4], 100)
   // console.log("ID", id)

   const transaction = await multisig.getV.call(id)
   // console.log(transaction.toString())

   assert.equal(transaction, 7, 'Transaction not properly added')
 })

})