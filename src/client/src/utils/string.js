import web3utils from "web3-utils"

export const truncateAddress = (str) => str.slice(0, 10) + "..." + str.slice(-10)

export const truncateAddressTo = (str, digits) => str.slice(0, digits/2) + "..." + str.slice(-digits/2)

export const formatNr = (nrString, digits) => {
  return Number.parseFloat(nrString).toFixed(digits)
}

export const weiToFixed = (nrString, digits) => {
  try {
    const eth = web3utils.fromWei(nrString, "ether")
    return Number.parseFloat(Number.parseFloat(eth).toFixed(digits))
  } catch (e) {
    return "..error.."
  }
}