pragma solidity 0.6.3;

import "./SavingDai.sol";

// Wrapper to test the internal functions of the SavingDai contract
contract TestWrapperSavingDai is SavingDai {

    constructor() public {
        authorize();
    }

    function join_(uint wad) external {
        join(wad);
    }

    function exit_(uint wad) external {
        exit(wad);
    }

    function exitAll_() external {
        exitAll();
    }
}
