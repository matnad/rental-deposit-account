pragma solidity >= 0.5.15  < 0.6.0;


interface PotLike {
    function drip() external  returns (uint tmp);
    function join(uint wad) external;
    function exit(uint wad) external;
}


contract DaiSaving {

    function join(uint wad) external {
        PotLike pot = PotLike(0x19E602E0dC93749Ea7aFa0C88F4693d4C02102D3);
        pot.drip();
        // need to authorize the pot contract?
        pot.join(wad);
    }

}
