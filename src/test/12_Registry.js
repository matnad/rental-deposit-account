const truffleAssert = require("truffle-assertions")

const BN = web3.utils.BN
const toWei = web3.utils.toWei
const fromWei = web3.utils.fromWei

const Registry = artifacts.require("RDARegistry")

contract("RDARegistry: Register", (accounts) => {
    const participants = [accounts[0], accounts[1], accounts[2]]
    const tenant = participants[0], landlord = participants[1], trustee = participants[2]

    it(`register a new contract and try to retrieve it`, async () => {
        const registry = await Registry.deployed()

        // test with call
        const callAddr = await registry.createRDA.call(...participants, toWei("0.1", "ether"))

        // Run it
        const result = await registry.createRDA(...participants, toWei("0.1", "ether"))
        truffleAssert.eventEmitted(
            result, 'createdRDA',
            {tenant, trustee, landlord}
        )
        const logAddr = result.logs[0].args['rdaAddress'];

        // Verify
        assert.equal(callAddr, logAddr, 'Addresses should be the same.')

        for (let i = 0; i < participants.length; i++) {
            const contracts = await registry.getByParticipant.call(participants[i])
            assert.equal(contracts[0], logAddr, 'Wrong contract fetched.')
        }
        const contracts = await registry.getByParticipant.call(accounts[9])
        assert.equal(contracts.length, 0, 'No contracts should be found.')
    })
})