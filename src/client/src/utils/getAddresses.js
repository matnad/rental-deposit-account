import RDARegistry from "../contracts/RDARegistry"

const addresses = {
  "42": {
    vat: "0xbA987bDB501d131f766fEe8180Da5d81b34b69d9",
    pot: "0xEA190DBDC7adF265260ec4dA6e9675Fd4f5A78bb",
    join: "0x5AA71a3ae1C0bd6ac27A1f28e1415fFFB6F15B8c",
    dai: "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa",
    reg: "0xb900a28a1FB674674056e6E6edc93F62850E6695",
  },
  "999": {
    vat: "0x11C8d156E1b5FD883E31e9091874F2af80b02775",
    pot: "0x19E602E0dC93749Ea7aFa0C88F4693d4C02102D3",
    join: "0x8C4Be23DE45F82a4feC7a93F69929Bd2A13A4777",
    dai: "0x8D68d36D45A34A6Ff368069bD0baa32ad49A6092",
  }
}

export function getAddress(chainId, type) {
  if (chainId === "42") {
    try {
      return addresses["42"][type]
    } catch (e) {
      console.log("Address not found for chain " + chainId)
      return "0x0"
    }
  } else if (chainId === "999") {
    if (type === "reg") {
      const deployedNetwork = RDARegistry.networks[chainId]
      return deployedNetwork ? deployedNetwork.address : "0x0"
    } else {
      try {
        return addresses["999"][type]
      } catch (e) {
        console.log("Address not found for chain " + chainId)
        return "0x0"
      }
    }
  }
}