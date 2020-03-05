pragma solidity 0.6.3;

interface PotLike {
    function chi() external view returns (uint);
    function rho() external view returns (uint);
    function drip() external returns (uint);
    function join(uint256) external;
    function exit(uint256) external;
    function pie(address) external view returns (uint);
}

interface JoinLike {
    function join(address, uint) external;
    function exit(address, uint) external;
}

interface VatLike {
    function hope(address) external;
    function dai(address) external view returns (uint);
}

interface GemLike {
    function balanceOf(address) external returns (uint);
    function approve(address, uint) external returns (bool);
    function transfer(address, uint) external returns (bool);
}

contract SavingDai {
    // --- Storage ---
    bool isDSRAuthorized;

    // --- MakerDao contracts ---
    VatLike public vat = VatLike(0x11C8d156E1b5FD883E31e9091874F2af80b02775);
    PotLike public pot = PotLike(0x19E602E0dC93749Ea7aFa0C88F4693d4C02102D3);
    JoinLike public daiJoin = JoinLike(0x8C4Be23DE45F82a4feC7a93F69929Bd2A13A4777);
    GemLike public daiToken = GemLike(0x8D68d36D45A34A6Ff368069bD0baa32ad49A6092);

    // --- Math ---
    uint constant RAY = 10 ** 27;
    function add(uint x, uint y) internal pure returns (uint z) {
        require((z = x + y) >= x);
    }
    function sub(uint x, uint y) internal pure returns (uint z) {
        require((z = x - y) <= x);
    }
    function mul(uint x, uint y) internal pure returns (uint z) {
        require(y == 0 || (z = x * y) / y == x);
    }
    function rdiv(uint x, uint y) internal pure returns (uint z) {
        // always rounds down
        z = mul(x, RAY) / y;
    }
    function rdivup(uint x, uint y) internal pure returns (uint z) {
        // always rounds up
        z = add(mul(x, RAY), sub(y, 1)) / y;
    }

    // --- Modifiers ---
    modifier dsrAuthorized() {
        require(isDSRAuthorized, 'DSR/not-authorized');
        _;
    }

    // --- Logic Functions ---

    /// Needs to be called once before the other functions can be used
    /// uint(-1) is the maximum value for an uint (underflow by 1) -> allowance is set to max
    function dsrAuthorize() internal returns(bool) {
        if (!isDSRAuthorized) {
            vat.hope(address(pot));
            vat.hope(address(daiJoin));
            daiToken.approve(address(daiJoin), uint(-1));
            isDSRAuthorized = true;
        }
        return true;
    }

    function dsrJoin(uint wad) internal dsrAuthorized returns(bool) {
        uint chi = (now > pot.rho()) ? pot.drip() : pot.chi();
        uint pie = rdiv(wad, chi);
        daiJoin.join(address(this), wad);
        pot.join(pie);
        return true;
    }

    function dsrExit(uint wad) internal dsrAuthorized returns(bool) {
        uint chi = (now > pot.rho()) ? pot.drip() : pot.chi();
        uint pie = rdivup(wad, chi);
        pot.exit(pie);
        daiJoin.exit(address(this), wad);
        return true;
    }

    function dsrExitAll() internal dsrAuthorized returns(bool) {
        if (now > pot.rho()) pot.drip();
        pot.exit(pot.pie(address(this)));
        daiJoin.exit(address(this), vat.dai(address(this)) / RAY);
        return true;
    }

    function dsrBalance() public view returns (uint) {
        uint pie = pot.pie(address(this));
        uint chi = pot.chi();
        return mul(pie, chi) / RAY;
    }

}
