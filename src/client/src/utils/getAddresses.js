import RDARegistry from "../contracts/RDARegistry"

const addresses = {
  "1": {
    vat: "0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B",
    pot: "0x197E90f9FAD81970bA7976f33CbD77088E5D7cf7",
    join: "0x9759A6Ac90977b93B58547b4A71c78317f391A28",
    dai: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    reg: "0xda2113810Be6C013dbCEBa1e7aF1e881557D4c87",
  },
  "42": {
    vat: "0xbA987bDB501d131f766fEe8180Da5d81b34b69d9",
    pot: "0xEA190DBDC7adF265260ec4dA6e9675Fd4f5A78bb",
    join: "0x5AA71a3ae1C0bd6ac27A1f28e1415fFFB6F15B8c",
    dai: "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa",
    reg: "0x067E7B00FC7726B249b345609B9ECDCC8000f066",
  },
  "999": {
    vat: "0x11C8d156E1b5FD883E31e9091874F2af80b02775",
    pot: "0x19E602E0dC93749Ea7aFa0C88F4693d4C02102D3",
    join: "0x8C4Be23DE45F82a4feC7a93F69929Bd2A13A4777",
    dai: "0x8D68d36D45A34A6Ff368069bD0baa32ad49A6092",
  }
}

export function getAddress(chainId, type) {
  if (chainId === "1") {
    try {
      return addresses["1"][type]
    } catch (e) {
      console.log("Address not found for chain " + chainId)
      return "0x00"
    }
  }
  if (chainId === "42") {
    try {
      return addresses["42"][type]
    } catch (e) {
      console.log("Address not found for chain " + chainId)
      return "0x00"
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