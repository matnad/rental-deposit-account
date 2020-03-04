pragma solidity 0.6.3;

import "./SavingDai.sol";

contract MultisigRDA is SavingDai {

    // --- Constants ---

    // --- Storage ---
    uint trusteeFee;
    mapping(uint => Transaction) public transactions;
    mapping(uint => mapping(address => bool)) public confirmations;
    address[3] public participants;
    mapping(address => bool) public isParticipant;
    uint public txnCount;
    enum TransactionType {ReturnDeposit, PayDamages, Migrate}

    struct Transaction {
        address owner;
        TransactionType txnType;
        address dest;
        bool executed;
        uint value;
    }

    // --- Events ---
    event Confirmation(address indexed sender, uint indexed txnId);
    event Revocation(address indexed sender, uint indexed txnId);
    event Submission(uint indexed txnId);
    event Execution(uint indexed txnId);
    event ExecutionFailure(uint indexed txnId);

    // --- Modifiers ---
    modifier onlyParticipant() {
        require(isParticipant[msg.sender], 'RDA/not-allowed');
        _;
    }

    modifier transactionExists(uint txnId) {
        require(transactions[txnId].owner != address(0), 'RDA/invalid-txn');
        _;
    }

    modifier confirmed(uint txnId, address participant) {
        require(confirmations[txnId][participant], 'RDA/txn-not-confirmed');
        _;
    }

    modifier notConfirmed(uint txnId, address participant) {
        require(!confirmations[txnId][participant], 'RDA/txn-confirmed');
        _;
    }

    modifier notExecuted(uint txnId) {
        require(!transactions[txnId].executed, 'RDA/txn-executed');
        _;
    }

    // --- Functions ---

    // ** Constructor **
    constructor(address tenant, address landlord, address trustee, uint _trusteeFee) public {
        require(
            tenant != address(0) && landlord != address(0) && trustee != address(0),
            'RDA/empty-address'
        );
        participants = [tenant, landlord, trustee];
        isParticipant[tenant] = true;
        isParticipant[landlord] = true;
        isParticipant[trustee] = true;
        trusteeFee = _trusteeFee;
    }

    // ** External Functions **

    // Transaction to return the deposit. Takes no further arguments.
    function submitTransaction(TransactionType txnType)
        external
        onlyParticipant
        returns (uint txnId)
    {
        require(txnType == TransactionType.ReturnDeposit, 'RDA/invalid-arguments');
        txnId = submitTransaction(txnType, address(0), 0);
    }

    // Transaction to pay the landlord.
    function submitTransaction(TransactionType txnType, uint value)
        external
        onlyParticipant
        returns (uint txnId)
    {
        require(txnType == TransactionType.PayDamages, 'RDA/invalid-arguments');
        txnId = submitTransaction(txnType, address(0), value);
    }

    // Transaction to migrate the contract.
    function submitTransaction(TransactionType txnType, address dest)
        external
        onlyParticipant
        returns (uint txnId)
    {
        require(txnType == TransactionType.Migrate, 'RDA/invalid-arguments');
        txnId = submitTransaction(txnType, dest, 0);
    }

    // ** Public Functions **

    function confirmTransaction(uint txnId)
        public
        onlyParticipant
        transactionExists(txnId)
        notConfirmed(txnId, msg.sender)
        notExecuted(txnId) // immutability of executed transactions
    {
        confirmations[txnId][msg.sender] = true;
        emit Confirmation(msg.sender, txnId);
    }

    function revokeConfirmation(uint txnId)
        public
        onlyParticipant
        transactionExists(txnId)
        confirmed(txnId, msg.sender)
        notExecuted(txnId)
    {
        confirmations[txnId][msg.sender] = false;
        emit Revocation(msg.sender, txnId);
    }

    function executeTransaction(uint txnId)
        public
        onlyParticipant // this is conservative
        transactionExists(txnId)
        confirmed(txnId, msg.sender) // this is conservative
        notExecuted(txnId)
    {
        if (isConfirmed(txnId)) {
            Transaction storage txn = transactions[txnId];
            txn.executed = true;
            bool success = false;
            if (txn.txnType == TransactionType.ReturnDeposit) {
                success = returnDeposit();
            } else if (txn.txnType == TransactionType.PayDamages) {
                success = payDamages(txn.value);
            } else if (txn.txnType == TransactionType.Migrate) {
                success = migrate(txn.dest);
            }
            if (success) {
                emit Execution(txnId);
            } else {
                emit ExecutionFailure(txnId);
                txn.executed = false;
            }
        }
    }

    //noinspection NoReturn (will return false by default)
    function isConfirmed(uint txnId)
        public
        view
        returns (bool)
    {
        uint count = 0;
        for (uint i = 0; i < 3; i++) {
            if (confirmations[txnId][participants[i]])
                count += 1;
            if (count == 2)
                return true;
        }
    }

    function getTenant() public view returns(address) {
        return participants[0];
    }

    function getLandlord() public view returns(address) {
        return participants[1];
    }

    function getTrustee() public view returns(address) {
        return participants[2];
    }

    // ** Internal State Functions **

    /// @dev Transaction builder. Unifies all the overloaded functions.
    function submitTransaction(TransactionType txnType, address dest, uint value)
        internal
        returns (uint txnId)
    {
        txnId = addTransaction(txnType, dest, value);
        confirmTransaction(txnId);
    }

    function addTransaction(TransactionType txnType, address dest, uint value)
        internal
        returns (uint txnId)
    {
        txnId = txnCount;
        transactions[txnId] = Transaction({
            owner : msg.sender,
            txnType : txnType,
            dest : dest,
            executed : false,
            value : value
            });
        txnCount += 1;
        emit Submission(txnId);
    }

    // ** Internal Logic Functions **

    function returnDeposit()
        internal
        pure // temp
        returns (bool success)
    {
        // will return deposit to the tenant
        // function is not yet implemented
        success = true;
    }

    function payDamages(uint value)
        internal
        pure // temp
        returns (bool success)
    {
        // will transfer min(value, balance) DAI to the landlord
        // function is not yet implemented and will throw compiler warnings (ignore them)
        success = true;
    }

    function migrate(address dest)
        internal
        pure // temp
        returns (bool success)
    {
        // will transfer all funds to a new address
        // function is not yet implemented and will throw compiler warnings (ignore them)
        success = true;
    }


    // ** Web3 call functions (Public & View) **

    function getConfirmationCount(uint txnId)
        public
        view
        returns (uint count)
    {
        for (uint i = 0; i < 3; i++) {
            if (confirmations[txnId][participants[i]]) {
                count += 1;
            }
        }
    }

    function getConfirmationStatus(uint txnId)
        public
        view
        returns (bool[] memory confirmationStatus)
    {
        confirmationStatus = new bool[](3);
        for (uint i = 0; i < 3; i++) {
            if (confirmations[txnId][participants[i]]) {
                confirmationStatus[i] = true;
            }
        }
    }

    function getTransactionIds(bool pending, bool executed)
        public
        view
        returns (uint[] memory txnIds)
    {
        uint[] memory txnIdsTemp = new uint[](txnCount);
        uint count = 0;
        uint i;
        for (i = 0; i < txnCount; i++) {
            if (pending && !transactions[i].executed || executed && transactions[i].executed) {
                txnIdsTemp[count] = i;
                count += 1;
            }
        }
        txnIds = new uint[](count);
        for (i = 0; i < count; i++)
            txnIds[i] = txnIdsTemp[i];
    }

}
