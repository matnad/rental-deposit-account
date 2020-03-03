pragma solidity >= 0.5.15  < 0.6.0;

contract MultisigRDA {
    address[3] private participants;

//    enum TransactionType {ReturnDeposit, PayDamages, Migrate}
    mapping (uint => Transaction) public transactions;
    struct Transaction {
        address owner;
        uint8 tx_type;
        address target;
        bool executed;
        uint value;
    }
    uint public transactionCount;

    function addTransaction(uint8 tx_type, address target, uint value) public returns (uint transactionId){
        transactionId = transactionCount;
        transactions[transactionId] = Transaction({
            owner: msg.sender,
            tx_type: tx_type,
            target: target,
            executed: false,
            value: value
        });
        transactionCount += 1;
    }

    // temp, for testing
    function getV(uint transactionId) public view returns(uint8 target) {
        Transaction storage txn = transactions[transactionId];
        target = txn.tx_type;
    }

    constructor(address one, address two, address three) public {
        participants = [one, two, three];
    }

    // temp
    function getAccs() public view  returns (address[3] memory) {
        return participants;
    }

}
