pragma solidity 0.6.3;

import "./SavingDai.sol";

// Wrapper to test the internal functions of the SavingDai contract
contract TestWrapperSavingDai is SavingDai {

    constructor() public {
        dsrAuthorize();
    }

    function join_(uint wad) external {
        dsrJoin(wad);
    }

    function exit_(uint wad) external {
        dsrExit(wad);
    }

    function exitAll_() external {
        dsrExitAll();
    }
}
