pragma solidity 0.6.3;

import './MultisigRDA.sol';

contract RDARegistry {
    mapping(uint => address) public rdaAddresses;
    mapping(uint => rdaContract) public rdaContracts;

    struct rdaContract {
        address tenant;
        address landlord;
        address trustee;
    }

    uint public rdaCount;

    event createdRDA(
        address rdaAddress,
        uint id,
        address indexed tenant,
        address indexed landlord,
        address indexed trustee
    );

    function createRDA(address tenant, address landlord, address trustee, uint trusteeFee)
        public
        returns(address rdaAddress)
    {
        MultisigRDA rda = new MultisigRDA(tenant, landlord, trustee, trusteeFee);
        rdaAddress = address(rda);
        rdaAddresses[rdaCount] = rdaAddress;
        rdaContracts[rdaCount] = rdaContract(tenant, landlord, trustee);
        emit createdRDA(rdaAddress, rdaCount, tenant, landlord, trustee);
        rdaCount += 1;
    }

    function getByParticipant(address participant)
        public
        view
        returns(address[] memory contracts)
    {
        uint[] memory tempContractIds = new uint[](rdaCount);
        uint count = 0;
        for (uint i = 0; i < rdaCount; i++) {
            rdaContract memory rda = rdaContracts[i];
            if (rda.tenant == participant || rda.landlord == participant || rda.trustee == participant) {
                tempContractIds[count] = i;
                count += 1;
            }
        }
        contracts = new address[](count);
        for (uint i = 0; i < count; i++) {
            contracts[i] = rdaAddresses[i];
        }
    }
}
