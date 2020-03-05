pragma solidity 0.6.3;

import "./SavingDai.sol";

/// @title Rental Deposit Account with multisig and DSR locking
/// @author Matthias Nadler, University of Basel
/// @notice Lock a DAI deposit, gain interest and manage the deposit with help of a trustee
contract MultisigRDA is SavingDai {

    // --- Constants ---

    // --- Storage ---
    uint public trusteeFee;
    uint public trusteeFeePaid;
    uint public deposit;
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

    // --- Functions ---

    // ** Constructor **

    /// @dev Initializes the contract with the addresses. These values can never be changed.
    /// @param tenant The owner of the deposit that earns the interest
    /// @param landlord Can receive payments for damages up to the original deposit amount
    /// @param trustee Earns a fee for enforcing off-chain contracts via multisig
    constructor(address tenant, address landlord, address trustee, uint _trusteeFee) public {
        require(
            tenant != address(0) && landlord != address(0) && trustee != address(0),
            "RDA/empty-address"
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
        require(deposit == 0, "RDA/already-started");
        uint balance = daiToken.balanceOf(address(this));
        require(balance > 0, "RDA/no-dai-owned");
        deposit = balance;
        if (!dsrAuthorize() || !dsrJoin(balance)) {
            deposit = 0;
        }
    }

    /// @dev Submit a Transaction to return the deposit to the tenant. Requires two confirmations
    /// @return txnId The unique identifier of the transaction
    function submitTransactionReturnDeposit()
        external
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
                payout += balance;
                uint interest = currentInterest();
                if (withdraw > interest) {
                    withdraw = interest;
                }
            } else {
                payout = remainingFee;
            }

            payout += withdraw;
            trusteeFeePaid += payout;
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

    /// @dev Calculates the amount of DAI (in wei denomination) on the locked DSR position
    ///      that exceeds the initial deposit. This amount can not be negative
    /// @return interest accrued value on the locked DSR position that can be withdrawn
    function currentInterest() public view returns(uint interest) {
        uint totalDsrBalance = dsrBalance();
        if (totalDsrBalance > deposit) {
            interest = totalDsrBalance - deposit;
        }
    }

    /// @dev Check if a transaction has two or more confirmations and is ready to be executed
    /// @param txnId The unique identifier of the transaction
    /// returns true if the transaction is confirmed, false otherwise
    function isConfirmed(uint txnId)
        public
        view
        returns (bool)
    {
        uint count = 0;
        for (uint i = 0; i < 3; i++) {
            if (confirmations[txnId][participants[i]]) {
                count += 1;
            }
            if (count == 2) {
                return true;
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
        active
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

    /// @dev Transfers All remaining funds except for outstanding fees to the tenant.
    /// @return success is false only if the DAI transfer failed, true otherwise
    ///         even if no DAI was transferred (empty balance or locked fee)
    function returnDeposit()
        internal
        returns (bool success)
    {
        success = true;
        uint remainingFee = trusteeFee - trusteeFeePaid;
        dsrExitAll();
        uint balance = daiToken.balanceOf(address(this));
        if (balance > remainingFee) {
            success = daiToken.transfer(getTenant(), balance - remainingFee);
        }
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

    /// @dev Get the number of confirmations for a transaction
    /// @param txnId The unique identifier of the transaction
    /// @return count number of confirmations [0, 3]
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

    /// @dev Calculates the confirmed status for every participant of a transaction.
    /// @param txnId The unique identifier of the transaction.
    /// @return confirmationStatus as a boolean array like [true, false, true]
    ///         where the order is [tenant, landlord, trustee]
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
