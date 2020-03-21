pragma solidity 0.6.3;

import './MultisigRDA.sol';

/// @title Registry for creating and managing RDA contracts
/// @author Matthias Nadler, University of Basel
/// @notice Create and find Rental Deposit Account contracts
contract RDARegistry {

    // --- Storage ---
    mapping(uint => address) public rdaAddresses;
    mapping(uint => rdaContract) public rdaContracts;

    struct rdaContract {
        address tenant;
        address landlord;
        address trustee;
    }

    uint public rdaCount;

    event createdRDA(
        address indexed rdaAddress,
        uint id,
        address tenant,
        address landlord,
        address trustee
    );

    // --- Public Functions ---

    /// @dev create a new RDA contract and store the participants and the address
    /// @param tenant The owner of the deposit that earns the interest
    /// @param landlord Can receive payments for damages up to the original deposit amount
    /// @param trustee Earns a fee for enforcing off-chain contracts via multisig
    /// @param trusteeFee The flat fee for the trustee that is withheld; serves as compensation
    /// @return rdaAddress the address of the newly created contract
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

    /// @dev get all the RDA contracts that an address is involved in
    /// @param participant the address of the account to fetch the RDAs for
    /// @return contracts an array of contract addresses that are associated with the participant
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
            contracts[i] = rdaAddresses[tempContractIds[i]];
        }
    }
}
