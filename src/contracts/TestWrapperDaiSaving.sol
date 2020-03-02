pragma solidity >= 0.5.15  < 0.6.0;

import "./DaiSaving.sol";

// Wrapper to test the internal functions of the DaiSaving contract
contract TestWrapperDaiSaving is DaiSaving {
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
