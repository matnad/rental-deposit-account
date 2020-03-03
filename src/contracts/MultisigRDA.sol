pragma solidity >= 0.5.15  < 0.6.0;

contract MultisigRDA {

    // --- Events ---
    event Confirmation(address indexed sender, uint indexed txnId);
    event Revocation(address indexed sender, uint indexed txnId);
    event Submission(uint indexed txnId);
    event Execution(uint indexed txnId);
    event ExecutionFailure(uint indexed txnId);

    // --- Storage ---
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

    modifier transactionTypeExists(TransactionType txnType) {
        require(uint(txnType) < 3, 'RDA/invalid-txn-type');
        _;
    }

    // --- Functions ---

    /// @dev Transaction to return the deposit. Takes no further arguments.
    function submitTransaction(TransactionType txnType)
        public
        transactionTypeExists(txnType)
        returns (uint txnId)
    {
        require(txnType == TransactionType.ReturnDeposit, 'RDA/invalid-arguments');
        txnId = submitTransaction(txnType, address(0), 0);
    }

    /// @dev Transaction to pay the landlord.
    function submitTransaction(TransactionType txnType, uint value)
        public
        returns (uint txnId)
    {
        require(txnType == TransactionType.PayDamages, 'RDA/invalid-arguments');
        txnId = submitTransaction(txnType, address(0), value);
    }

    /// @dev Transaction to migrate the contract.
    function submitTransaction(TransactionType txnType, address dest)
        public
        returns (uint txnId)
    {
        require(txnType == TransactionType.Migrate, 'RDA/invalid-arguments');
        txnId = submitTransaction(txnType, dest, 0);
    }

    /// @dev INTERNAL transaction builder. Unifies all the overloaded functions
    function submitTransaction(TransactionType txnType, address dest, uint value)
        internal
        returns (uint txnId)
    {
        txnId = addTransaction(txnType, dest, value);
        confirmTransaction(txnId);
    }

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

    function addTransaction(TransactionType txnType, address dest, uint value)
        internal
        onlyParticipant
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

    constructor(address one, address two, address three)
        public
    {
        participants = [one, two, three];
        isParticipant[one] = true;
        isParticipant[two] = true;
        isParticipant[three] = true;
    }

    // --- Executed Transactions ---

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

    // --- Web3 call functions ---
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
            if (pending && !transactions[i].executed
            || executed && transactions[i].executed)
            {
                txnIdsTemp[count] = i;
                count += 1;
            }
        }
        txnIds = new uint[](count);
        for (i = 0; i < count; i++)
            txnIds[i] = txnIdsTemp[i];
    }

}
