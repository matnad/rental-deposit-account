export const desiredNetworks = ["42", "999"]
export const networkNames = {
  "1": "Ethereum Main Net",
  "2": "Morden",
  "3": "Ropsten",
  "4": "Rinkeby",
  "5": "Goerli",
  "42": "Kovan",
  "999": "Custom RPC",
}
export const etherscanUrl = {
  "1": "https://etherscan.io/",
  "3": "https://ropsten.etherscan.io/",
  "4": "https://rinkeby.etherscan.io/",
  "5": "https://goerli.etherscan.io/",
  "42": "https://kovan.etherscan.io/"
}

export const getEtherscanAddress = (address, chainId) => {
  if (etherscanUrl[chainId] != null) {
    return etherscanUrl[chainId] + 'address/' + address
  } else {
    return null
  }
}

export const getEtherscanTx = (txHash, chainId) => {
  if (etherscanUrl[chainId] != null) {
    return etherscanUrl[chainId] + 'tx/' + txHash
  } else {
    return null
  }
}

export const fiatCurrency = "CHF"

export const rowColors = ["#bbb", "#ccc"]