const truffleAssert = require("truffle-assertions")

const toWei = web3.utils.toWei
const fromWei = web3.utils.fromWei

const Multisig = artifacts.require("MultisigRDA")
const gemLike = artifacts.require("GemLike")

// testchain addresses
const daiAddress = "0x8d68d36d45a34a6ff368069bd0baa32ad49a6092"

contract("MultisigRDA: Multisig", (accounts) => {
    let returnDepositId, payDamagesId, migrateId
    const senders = [0,1,2] // accounts that add the transactions in this order

    it(`check if contract is properly initialized and start it`, async () => {
        const daiToken = await gemLike.at(daiAddress)
        const multisig = await Multisig.deployed()

        assert.equal(await multisig.participants.call(0), accounts[senders[0]], "acc1 failed to init")
        assert.equal(await multisig.participants.call(1), accounts[senders[1]], "acc2 failed to init")
        assert.equal(await multisig.participants.call(2), accounts[senders[2]], "acc3 failed to init")

        assert.equal(await multisig.isParticipant.call(accounts[senders[0]]), true)
        assert.equal(await multisig.isParticipant.call(accounts[senders[1]]), true)
        assert.equal(await multisig.isParticipant.call(accounts[senders[2]]), true)
        assert.equal(await multisig.isParticipant.call(accounts[5]), false)

        // send some dai and activate the contract, this functionality is tested in multiple other tests
        await daiToken.transfer(multisig.address, toWei("0.1", "ether"), {from: accounts[senders[0]]})
        await multisig.start({from: accounts[senders[0]]})
    })

    it(`add a "Return Deposit" transaction`, async () => {
        const sender = senders[0]
        const txnType = 0 // Return Deposit
        multisig = await Multisig.deployed()

        const result = await multisig.submitTransactionReturnDeposit({from: accounts[sender]})
        returnDepositId = result.logs[0].args['txnId']
        // assert submission and confirmation events
        truffleAssert.eventEmitted(result, 'Submission', { txnId: returnDepositId })
        truffleAssert.eventEmitted(result, 'Confirmation', { sender: accounts[sender], txnId: returnDepositId })

        // retrieve the submitted transaction and verify it
        const txn = await multisig.transactions.call(returnDepositId)
        assert.equal(txn.owner, accounts[sender], "owner mismatch")
        assert.equal(txn.txnType, txnType, "TransactionType mismatch")
        assert.equal(txn.dest, "0x0000000000000000000000000000000000000000", "destination mismatch")
        assert.equal(txn.executed, false, "executed mismatch")
        assert.equal(txn.value, 0, "value mismatch")

        // check if the transaction is confirmed only by the sender
        for (let i = 0; i < 3; i++) {
            const confirm = await multisig.confirmations.call(returnDepositId, accounts[senders[i]])
            assert.equal(confirm, i === sender, "wrong confirmation status")
        }
    })

    it(`add a "Pay Damages" transaction`, async () => {
        const sender = senders[1]
        const txnType = 1 // Pay Damages
        const amount = 50 // in DAI
        multisig = await Multisig.deployed()

        const result = await multisig.submitTransactionPayDamages(toWei(amount.toString(), "ether"), {from: accounts[sender]})
        payDamagesId = result.logs[0].args['txnId']

        // assert submission and confirmation events
        truffleAssert.eventEmitted(result, 'Submission', { txnId: payDamagesId })
        truffleAssert.eventEmitted(result, 'Confirmation', { sender: accounts[sender], txnId: payDamagesId })

        // retrieve the submitted transaction
        const txn = await multisig.transactions.call(payDamagesId)
        // assert the transaction
        assert.equal(txn.owner, accounts[sender], "owner mismatch")
        assert.equal(txn.txnType, txnType, "TransactionType mismatch")
        assert.equal(txn.dest, "0x0000000000000000000000000000000000000000", "destination mismatch")
        assert.equal(txn.executed, false, "executed mismatch")
        assert.equal(fromWei(txn.value.toString(), "ether"), amount, "value mismatch")

        // check if the transaction is confirmed only by the sender
        for (let i = 0; i < 3; i++) {
            const confirm = await multisig.confirmations.call(payDamagesId, accounts[senders[i]])
            assert.equal(confirm, i === sender, "wrong confirmation status")
        }
    })

    it(`add a "Migrate" transaction`, async () => {
        const sender = senders[0]
        const txnType = 2 // Migrate
        const dest = accounts[9] // address of new contract or address to migrate to
        multisig = await Multisig.deployed()

        const result = await multisig.submitTransactionMigrate(dest, {from: accounts[sender]})
        migrateId = result.logs[0].args['txnId']

        // assert submission and confirmation events
        truffleAssert.eventEmitted(result, 'Submission', { txnId: migrateId })
        truffleAssert.eventEmitted(result, 'Confirmation', { sender: accounts[sender], txnId: migrateId })

        // retrieve the submitted transaction
        const txn = await multisig.transactions.call(migrateId)

        // assert the transaction
        assert.equal(txn.owner, accounts[sender], "owner mismatch")
        assert.equal(txn.txnType, txnType, "TransactionType mismatch")
        assert.equal(txn.dest, dest, "destination mismatch")
        assert.equal(txn.executed, false, "executed mismatch")
        assert.equal(txn.value, 0, "value mismatch")

        // check if the transaction is confirmed only by the sender
        for (let i = 0; i < 3; i++) {
            const confirm = await multisig.confirmations.call(migrateId, accounts[senders[i]])
            assert.equal(confirm, i === sender, "wrong confirmation status")
        }
    })

    it(`attempt to create each transaction type from a non-participant account`, async () => {
        await truffleAssert.reverts(
            multisig.submitTransactionReturnDeposit({from: accounts[6]}),
            "RDA/not-allowed",
        )
        await truffleAssert.reverts(
            multisig.submitTransactionPayDamages(100, {from: accounts[7]}),
            "RDA/not-allowed",
        )
        await truffleAssert.reverts(
            multisig.submitTransactionMigrate(accounts[5], {from: accounts[8]}),
            "RDA/not-allowed",
        )
        // validate that there are 3 pending transactions
        assert.equal((await multisig.getTransactionIds.call(true, false)).length, 3, 'wrong number of pending transactions')
    })

    it(`revoke confirmation for "Return Deposit" transaction`, async () => {
        // Revoke for unauthorized participant
        await truffleAssert.reverts(
            multisig.revokeConfirmation(returnDepositId, {from: accounts[4]}),
            "RDA/not-allowed",
        )

        // Revoke for a participant that did not confirm yet
        await truffleAssert.reverts(
            multisig.revokeConfirmation(returnDepositId, {from: accounts[senders[2]]}),
            "RDA/txn-not-confirmed",
        )

        // Revoke for a participant that did confirm
        const result = await multisig.revokeConfirmation(returnDepositId, {from: accounts[senders[0]]})
        truffleAssert.eventEmitted(result, 'Revocation', { sender: accounts[senders[0]], txnId: returnDepositId })

        // transaction should have 0 confirmations
        for (let i = 0; i < 3; i++) {
            const confirm = await multisig.confirmations.call(returnDepositId, accounts[senders[i]])
            assert.equal(confirm, false, "wrong confirmation status")
        }
    })

    it(`add second confirmation for "Pay Damages" transaction`, async () => {
        // Add for unauthorized participant
        await truffleAssert.reverts(
            multisig.confirmTransaction(payDamagesId, {from: accounts[7]}),
            "RDA/not-allowed",
        )

        // Add for a participant that did already add
        await truffleAssert.reverts(
            multisig.confirmTransaction(payDamagesId, {from: accounts[senders[1]]}),
            "RDA/txn-confirmed",
        )

        // verify isConfirmed == false
        assert.equal(await multisig.isConfirmed.call(payDamagesId), false, 'transaction should be unconfirmed')


        // Add for a participant that did not confirm yet
        const result = await multisig.confirmTransaction(payDamagesId, {from: accounts[senders[0]]})
        truffleAssert.eventEmitted(result, 'Confirmation', { sender: accounts[senders[0]], txnId: payDamagesId })
        // transaction should have 2 confirmations
        for (let i = 0; i < 3; i++) {
            const confirm = await multisig.confirmations.call(payDamagesId, accounts[senders[i]])
            assert.equal(confirm, [0,1].includes(i), "wrong confirmation status")
        }
        // verify isConfirmed == true
        assert.equal(await multisig.isConfirmed.call(payDamagesId), true, 'transaction should be confirmed')
        // verify addresses and test getConfirmationStatus function
        const status = await multisig.getConfirmationStatus.call(payDamagesId)
        assert.equal(status[0], true, 'confirmation status mismatch')
        assert.equal(status[1], true, 'confirmation status mismatch')
        assert.equal(status[2], false, 'confirmation status mismatch')
    })

    it(`remove the added confirmation for "Pay Damages" and add it again`, async () => {
        // Revoke for participant that did confirm
        let result = await multisig.revokeConfirmation(payDamagesId, {from: accounts[senders[0]]})
        truffleAssert.eventEmitted(result, 'Revocation', { sender: accounts[senders[0]], txnId: payDamagesId })
        // verify isConfirmed == false
        assert.equal(await multisig.isConfirmed.call(payDamagesId), false, 'transaction should be unconfirmed')

        // Add again
        result = await multisig.confirmTransaction(payDamagesId, {from: accounts[senders[0]]})
        truffleAssert.eventEmitted(result, 'Confirmation', { sender: accounts[senders[0]], txnId: payDamagesId })
        // verify isConfirmed == true
        assert.equal(await multisig.isConfirmed.call(payDamagesId), true, 'transaction should be confirmed')
    })

    it(`add third confirmation and check if still confirmed then remove it`, async () => {
        // Add third confirmation
        let result = await multisig.confirmTransaction(payDamagesId, {from: accounts[senders[2]]})
        truffleAssert.eventEmitted(result, 'Confirmation', { sender: accounts[senders[2]], txnId: payDamagesId })
        // transaction should have 3 confirmations
        for (let i = 0; i < 3; i++) {
            const confirm = await multisig.confirmations.call(payDamagesId, accounts[senders[i]])
            assert.equal(confirm, true, "wrong confirmation status")
        }
        // verify isConfirmed == true
        assert.equal(await multisig.isConfirmed.call(payDamagesId), true, 'transaction should be confirmed')
        // Revoke again
        result = await multisig.revokeConfirmation(payDamagesId, {from: accounts[senders[2]]})
        truffleAssert.eventEmitted(result, 'Revocation', { sender: accounts[senders[2]], txnId: payDamagesId })
        // verify isConfirmed == true
        assert.equal(await multisig.isConfirmed.call(payDamagesId), true, 'transaction should be confirmed')
    })

    it(`execute transaction "Pay Damages" with invalid and valid participant`, async () => {
        // invalid participant
        await truffleAssert.reverts(
            multisig.executeTransaction(payDamagesId, {from: accounts[8]}),
            "RDA/not-allowed",
        )
        // valid participant
        const result = await multisig.executeTransaction(payDamagesId, {from: accounts[senders[1]]})
        truffleAssert.eventEmitted(result, 'Execution', { txnId: payDamagesId })
        const txn = await multisig.transactions.call(payDamagesId)
        assert.equal(txn.executed, true, 'transaction should be executed')
        // test if pending and executed transactionIds (or counts) match
        assert.equal((await multisig.getTransactionIds.call(true, false)).length, 2, 'wrong number of pending transactions')
        assert.equal((await multisig.getTransactionIds.call(false, true))[0].toString(), payDamagesId.toString(), 'wrong number of pending transactions')
    })

    it(`try to revoke and add confirmation on an executed transaction`, async () => {
        // revoke confirmation
        await truffleAssert.reverts(
            multisig.revokeConfirmation(payDamagesId, {from: accounts[senders[1]]}),
            "RDA/txn-executed",
        )
        // add confirmation
        await truffleAssert.reverts(
            multisig.confirmTransaction(payDamagesId, {from: accounts[senders[2]]}),
            "RDA/txn-executed",
        )
    })

    it(`confirm and execute the "Return Deposit" and "Migrate" transaction`, async () => {
        // Return Deposit
        for (let i = 0; i < 2; i++) {
            let result = await multisig.confirmTransaction(returnDepositId, {from: accounts[senders[i]]})
            truffleAssert.eventEmitted(result, 'Confirmation', { sender: accounts[senders[i]], txnId: returnDepositId })
        }

        let result = await multisig.executeTransaction(returnDepositId, {from: accounts[senders[0]]})
        truffleAssert.eventEmitted(result, 'Execution', { txnId: returnDepositId })
        let txn = await multisig.transactions.call(returnDepositId)
        assert.equal(txn.executed, true, 'transaction should be executed')

        // Migrate
        result = await multisig.confirmTransaction(migrateId, {from: accounts[senders[1]]})
        truffleAssert.eventEmitted(result, 'Confirmation', { sender: accounts[senders[1]], txnId: migrateId })

        // cant be executed with just tenant and landlord confirming
        result = await multisig.executeTransaction(migrateId, {from: accounts[senders[0]]})
        truffleAssert.eventNotEmitted(result, 'Execution');
        txn = await multisig.transactions.call(migrateId)
        assert.equal(txn.executed, false, 'transaction should not be executed')

        // it is possible with 2 confirmations if trustee is involved
        result = await multisig.revokeConfirmation(migrateId, {from: accounts[senders[1]]})
        truffleAssert.eventEmitted(result, 'Revocation', { sender: accounts[senders[1]], txnId: migrateId })
        result = await multisig.confirmTransaction(migrateId, {from: accounts[senders[2]]})
        truffleAssert.eventEmitted(result, 'Confirmation', { sender: accounts[senders[2]], txnId: migrateId })
        result = await multisig.executeTransaction(migrateId, {from: accounts[senders[2]]})
        truffleAssert.eventEmitted(result, 'Execution', { txnId: migrateId });
        txn = await multisig.transactions.call(migrateId)
        assert.equal(txn.executed, true, 'transaction should be executed')

        assert.equal((await multisig.getTransactionIds.call(true, false)).length, 0, 'wrong number of pending transactions')
        assert.equal((await multisig.getTransactionIds.call(false, true)).length, 3, 'wrong number of pending transactions')
    })

})