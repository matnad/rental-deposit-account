pragma solidity 0.6.3;

interface PotLike {
    function chi() external returns (uint256);
    function rho() external returns (uint256);
    function drip() external  returns (uint256);
    function join(uint256) external;
    function exit(uint256) external;
    function pie(address) external view returns (uint256);
}

interface JoinLike {
    function join(address, uint) external;
    function exit(address, uint) external;
}

interface VatLike {
    function hope(address) external;
    function dai(address) external view returns (uint256);
}

interface GemLike {
    function approve(address,uint) external returns (bool);
}

contract SavingDai {
    // --- Storage ---
    bool isAuthorized;

    // --- MakerDao contracts ---
    VatLike vat = VatLike(0x11C8d156E1b5FD883E31e9091874F2af80b02775);
    PotLike pot = PotLike(0x19E602E0dC93749Ea7aFa0C88F4693d4C02102D3);
    JoinLike daiJoin = JoinLike(0x8C4Be23DE45F82a4feC7a93F69929Bd2A13A4777);
    GemLike daiToken = GemLike(0x8D68d36D45A34A6Ff368069bD0baa32ad49A6092);

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
    modifier authorized() {
        require(isAuthorized, 'DSR/not-authorized');
        _;
    }

    // --- Logic Functions ---

    /// Needs to be called once before the other functions can be used
    function authorize() internal {
        if (!isAuthorized) {
            vat.hope(address(pot));
            vat.hope(address(daiJoin));
            daiToken.approve(address(daiJoin), uint(-1));
            isAuthorized = true;
        }
    }

    function join(uint wad) internal authorized {
        uint chi = (now > pot.rho()) ? pot.drip() : pot.chi();
        uint pie = rdiv(wad, chi);
        daiJoin.join(address(this), wad);
        pot.join(pie);
    }

    function exit(uint wad) internal authorized {
        uint chi = (now > pot.rho()) ? pot.drip() : pot.chi();
        uint pie = rdivup(wad, chi);
        pot.exit(pie);
        daiJoin.exit(address(this), wad);
    }

    function exitAll() internal authorized {
        if (now > pot.rho()) pot.drip();
        pot.exit(pot.pie(address(this)));
        daiJoin.exit(address(this), vat.dai(address(this)) / RAY);
    }

}
