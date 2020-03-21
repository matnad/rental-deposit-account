pragma solidity 0.6.3;

import "./SavingDai.sol";

/// @title Rental Deposit Account with multisig and DSR locking
/// @author Matthias Nadler, University of Basel
/// @notice Lock a DAI deposit, gain interest and manage the deposit with help of a trustee
contract MultisigRDA is SavingDai {

    // --- Storage ---
    uint public trusteeFee;
    uint public trusteeFeePaid;
    uint public landlordDamagePaid;
    uint public deposit;
    mapping(uint => Transaction) public transactions;
    mapping(uint => Document) public documents;
    mapping(uint => mapping(address => bool)) public confirmations;
    address[3] public participants;
    mapping(address => bool) public isParticipant;
    uint public txnCount;
    enum TransactionType {ReturnDeposit, PayDamages, Migrate, Document}

    struct Transaction {
        address owner;
        TransactionType txnType;
        address dest;
        bool executed;
        uint value;
    }

    struct Document {
        bytes32 name;
        bytes32 hash;
    }

    // --- Events ---
    event Confirmation(address indexed sender, uint indexed txnId);
    event Revocation(address indexed sender, uint indexed txnId);
    event Submission(uint indexed txnId);
    event Execution(uint indexed txnId);
    event ExecutionFailure(uint indexed txnId);
    event Withdrawal(address indexed initiator, address indexed receiver, uint value);

    // --- Modifiers ---
    modifier active() {
        require(deposit > 0, "RDA/not-active");
        _;
    }

    modifier onlyParticipant() {
        require(isParticipant[msg.sender], "RDA/not-allowed");
        _;
    }

    modifier transactionExists(uint txnId) {
        require(transactions[txnId].owner != address(0), "RDA/txn-invalid");
        _;
    }

    modifier confirmed(uint txnId, address participant) {
        require(confirmations[txnId][participant], "RDA/txn-not-confirmed");
        _;
    }

    modifier notConfirmed(uint txnId, address participant) {
        require(!confirmations[txnId][participant], "RDA/txn-confirmed");
        _;
    }

    modifier notExecuted(uint txnId) {
        require(!transactions[txnId].executed, "RDA/txn-executed");
        _;
    }

    modifier excludeDocuments(uint txnId) {
        require(transactions[txnId].txnType != TransactionType.Document, "RDA/illegal-for-doc");
        _;
    }

    // --- Functions ---

    // ** Constructor **

    /// @dev Initializes the contract with the addresses. These values can never be changed.
    /// @param tenant The owner of the deposit that earns the interest
    /// @param landlord Can receive payments for damages up to the original deposit amount
    /// @param trustee Earns a fee for enforcing off-chain contracts via multisig
    /// @param _trusteeFee The flat fee for the trustee that is withheld; serves as compensation
    constructor(address tenant, address landlord, address trustee, uint _trusteeFee) public {
        require(
            tenant != address(0) && landlord != address(0) && trustee != address(0),
            "RDA/empty-address"
        );
        require(
            tenant != landlord && tenant != trustee && landlord != trustee,
            "RDA/duplicate-addresses"
        );
        participants = [tenant, landlord, trustee];
        isParticipant[tenant] = true;
        isParticipant[landlord] = true;
        isParticipant[trustee] = true;
        trusteeFee = _trusteeFee;
    }

    // ** External Functions **

    /// @dev Sets the contract active and allows for further interaction. Will lock all DAI in DSR.
    ///      The deposit is equal to the DAI balance when this function is called and can never be changed.
    function start() external onlyParticipant {
        // require sender == tenant!
        require(deposit == 0, "RDA/already-started");
        uint balance = daiToken.balanceOf(address(this));
        require(balance > 0, "RDA/no-dai-found");
        deposit = balance;
        if (!dsrAuthorize() || !dsrJoin(balance)) {
            deposit = 0;
        }
    }

    /// @dev Submit a Transaction to return the deposit to the tenant. Requires two confirmations
    /// @return txnId The unique identifier of the transaction
    function submitTransactionReturnDeposit()
        external
        active
        onlyParticipant
        returns (uint txnId)
    {
        txnId = submitTransaction(TransactionType.ReturnDeposit, address(0), 0);
    }

    /// @dev Submit a Transaction to pay damages to the landlord. Requires two confirmations
    /// @param value The amount of DAI (in wei denominations) to transfer to the landlord
    /// @return txnId The unique identifier of the transaction
    function submitTransactionPayDamages(uint value)
        external
        active
        onlyParticipant
        returns (uint txnId)
    {
        txnId = submitTransaction(TransactionType.PayDamages, address(0), value);
    }

    /// @dev Submit a Transaction to Migrate the funds to a new address. Requires two confirmations
    /// @param dest The destination address to send the DAI funds
    /// @return txnId The unique identifier of the transaction
    function submitTransactionMigrate(address dest)
        external
        onlyParticipant
        returns (uint txnId)
    {
        txnId = submitTransaction(TransactionType.Migrate, dest, 0);
    }

    /// @dev Submit a new Document to the RDA that can be signed (confirmed)
    /// @param name The name of the document
    /// @param hash keccak256 hash of the document
    /// @return txnId The unique identifier of the transaction
    function submitTransactionDocument(bytes32 name, bytes32 hash)
        external
        onlyParticipant
        returns (uint txnId)
    {
        txnId = submitTransaction(TransactionType.Document, address(0), 0);
        documents[txnId] = Document({
            name: name,
            hash: hash
        });
    }

    // ** Public Functions **

    /// @dev Confirms a transaction if possible
    /// @param txnId The unique identifier of the transaction
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

    /// @dev Undoes a confirmation if possible
    /// @param txnId The unique identifier of the transaction
    function revokeConfirmation(uint txnId)
        public
        onlyParticipant
        excludeDocuments(txnId)
        transactionExists(txnId)
        confirmed(txnId, msg.sender)
        notExecuted(txnId)
    {
        confirmations[txnId][msg.sender] = false;
        emit Revocation(msg.sender, txnId);
    }

    /// @dev Execute a transaction that has two or more confirmations
    /// @param txnId The unique identifier of the transaction
    function executeTransaction(uint txnId)
        public
        onlyParticipant // this is conservative
        excludeDocuments(txnId)
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

    /// @dev Withdraw all interest, leaving the remaining deposit and fees locked on the contract
    function withdrawInterest()
        onlyParticipant
        active
        public
    {
        if (now > pot.rho()) pot.drip();
        uint contractBalance = daiToken.balanceOf(address(this));
        uint lockedDai = sub(add(deposit, sub(trusteeFee, trusteeFeePaid)), landlordDamagePaid);
        uint totalFunds = add(contractBalance, dsrBalance());
        if (totalFunds > lockedDai) {
            uint payout = totalFunds - lockedDai;
            if (payout > contractBalance) {
                dsrExit(payout - contractBalance);
            }
            if (daiToken.transfer(getTenant(), payout)) {
                emit Withdrawal(msg.sender, getTenant(), payout);
            }
        }
    }

    /// @dev Withdraw an amount up to the trusteeFee to the account of the trustee
    ///      This can only withdraw contract balance and accrued interest above the initial deposit value
    function withdrawTrusteeFee()
        onlyParticipant
        active
        public
    {
        if (trusteeFeePaid < trusteeFee) {
            uint remainingFee = trusteeFee - trusteeFeePaid;
            uint balance = daiToken.balanceOf(address(this));
            uint withdraw;
            uint payout;

            if (remainingFee > balance) {
                if (now > pot.rho()) pot.drip();
                withdraw = remainingFee - balance;
                payout = add(payout, balance);
                uint totalDsrBalance = dsrBalance();
                uint availableDSR;
                if (totalDsrBalance > deposit) {
                    availableDSR = totalDsrBalance - deposit;
                }
                if (withdraw >= availableDSR) {
                    withdraw = availableDSR;
                }
            } else {
                payout = remainingFee;
            }

            payout = add(payout, withdraw);
            trusteeFeePaid = add(payout, trusteeFeePaid);
            if (withdraw > 0) {
                dsrExit(withdraw);
            }
            if (daiToken.transfer(getTrustee(), payout)) {
                emit Withdrawal(msg.sender, getTrustee(), payout);
            } else {
                trusteeFeePaid -= payout; // refund if something failed
            }
        }
    }

    /// @dev Check if a transaction has enough confirmations and is ready to be executed
    ///      All transactions require two or more confirmations to be confirmed
    ///      The migrate transaction needs to be confirmed by the trustee
    /// @param txnId The unique identifier of the transaction
    /// returns true if the transaction is confirmed, false otherwise
    function isConfirmed(uint txnId)
        public
        view
        transactionExists(txnId)
        excludeDocuments(txnId)
        returns (bool)
    {
        Transaction memory txn = transactions[txnId];
        uint count = 0;
        for (uint i = 0; i < 3; i++) {
            if (confirmations[txnId][participants[i]]) {
                count += 1;
            }
            if (count >= 2) {
                if (txn.txnType == TransactionType.Migrate) {
                    if (i == 2) {
                        return confirmations[txnId][participants[i]];
                    }
                } else {
                    return true;
                }
            }
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

    // ** Internal Multisig Functions **

    /// @dev Transaction builder. Can't be invoked directly
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

    // ** Internal RDA Logic Functions **

    /// @dev Transfers All remaining funds except for outstanding fees to the tenant
    /// @return success is false only if the DAI transfer failed, true otherwise
    ///         even if no DAI was transferred (empty balance or locked fee)
    function returnDeposit()
        internal
        returns (bool success)
    {
        success = true;
        uint remainingFee = sub(trusteeFee, trusteeFeePaid);
        dsrExitAll();
        uint balance = daiToken.balanceOf(address(this));
        if (balance > remainingFee) {
            uint payout = balance - remainingFee;
            success = daiToken.transfer(getTenant(), payout);
            if (success) {
                emit Withdrawal(msg.sender, getTenant(), payout);
            }
        }
    }

    /// @dev Transfers an amount of DAI to the landlord as compensation
    ///      This amount can be up to the value of the initial deposit
    /// @param value of the DAI (in wei denomination) to transfer
    /// @return success is false only if the DAI transfer failed, true otherwise
    ///         even if no DAI was transferred (empty balance or no more claims)
    function payDamages(uint value)
        internal
        returns (bool success)
    {
        success = true;
        uint maxPayout = sub(deposit, landlordDamagePaid);
        if (maxPayout > 0) {
            uint payout = value;
            if (payout > maxPayout) {
                payout = maxPayout;
            }
            uint contractBalance = daiToken.balanceOf(address(this));
            landlordDamagePaid = add(landlordDamagePaid, payout);
            if (payout > contractBalance) {
                dsrExit(payout - contractBalance);
            }
            success = daiToken.transfer(getLandlord(), payout);
            if (success) {
                emit Withdrawal(msg.sender, getLandlord(), payout);
            } else {
                landlordDamagePaid -= payout;
            }
        }
    }

    /// @dev exit and migrate all DAI funds to a new address
    /// @param dest the address to migrate the funds to
    /// @return success is true if the funds could be transferred, false otherwise
    function migrate(address dest)
        internal
        returns (bool success)
    {
        dsrExitAll();
        uint balance = daiToken.balanceOf(address(this));
        success = daiToken.transfer(dest, balance);
    }


    // ** Web3 call functions (Public & View) **

    /// @dev Get the participants involved in this contract.
    /// @return participantsArr An array with the three participants' addresses.
    function getParticipants()
        public
        view
        returns (address[] memory participantsArr)
    {
        participantsArr = new address[](3);
        for (uint i = 0; i < 3; i++) {
            participantsArr[i] = participants[i];
        }
    }

    /// @dev Grabs all the details needed for a specific transaction (request or document)
    /// @param txnId The unique identifier of the transaction.
    function getTransactionInfo(uint txnId)
        public
        view
        transactionExists(txnId)
        returns (
            address owner,
            TransactionType txnType,
            address dest,
            bool executed,
            uint value,
            bool[] memory confirmationStatus,
            bytes32 name,
            bytes32 hash
        )
    {
        Transaction memory transaction = transactions[txnId];
        owner = transaction.owner;
        txnType = transaction.txnType;
        dest = transaction.dest;
        executed = transaction.executed;
        value = transaction.value;
        if(transaction.txnType == TransactionType.Document) {
            name = documents[txnId].name;
            hash = documents[txnId].hash;
        }
        confirmationStatus = new bool[](3);
        for (uint i = 0; i < 3; i++) {
            if (confirmations[txnId][participants[i]]) {
                confirmationStatus[i] = true;
            }
        }
    }

    /// @dev Get a list of all transaction IDs that match the filter arguments
    /// @param pending will include non-completed transactions if set to true
    /// @param pending will include completed transactions if set to true
    /// @return txnIds an array with all the transaction IDs that match the arguments
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
