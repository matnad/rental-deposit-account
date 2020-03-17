import {RDA_POPULATED, RDA_SELECTED, RDA_UPDATE_SELECTED, RDAS_LOADED, RDAS_LOADING} from "./types"
import RDARegistry from "../contracts/RDARegistry"
import MultisigRDA from "../contracts/MultisigRDA"
import GemLike from "../contracts/GemLike"
import {getEthereum} from "../utils/getEthereum"
import Web3 from "web3"
import {desiredNetworks} from "../utils/settings"
import addresses from "../utils/addresses"

export const loadRdas = (account) => (dispatch) => {
  dispatch({type: RDAS_LOADING})

  let web3

  async function getRdas(account) {
    web3 = new Web3(await getEthereum())
    const chainId = (await web3.eth.net.getId()).toString()

    if (!desiredNetworks.includes(chainId)) {
      return []
    }

    const deployedNetwork = RDARegistry.networks[chainId]
    const registry = await new web3.eth.Contract(
      RDARegistry.abi,
      deployedNetwork && deployedNetwork.address,
    )

    return await registry.methods.getByParticipant(account).call()

  }

  getRdas(account)
    .then(rdas => {
      dispatch({
        type: RDAS_LOADED,
        payload: rdas
      })
      rdas.forEach(rdaAddress => {
        const rdaContract = new web3.eth.Contract(MultisigRDA.abi, rdaAddress)
        rdaContract.methods.getParticipants().call()
          .then(rdaParticipants => {
            dispatch({
              type: RDA_POPULATED,
              payload: {
                rdaAddress,
                rdaParticipants
              }
            })
          })
      })
    })
}

export const selectRda = (address) => (dispatch) => {
  async function getRda(address) {
    const web3 = new Web3(await getEthereum())
    const chainId = (await web3.eth.net.getId()).toString()

    if (!desiredNetworks.includes(chainId)) {
      return undefined
    }

    try {
      address = web3.utils.toChecksumAddress("0x" + address.slice(-40)) // hacky?
    } catch (e) {
      console.log(`Invalid contract address returned: ${address}`)
      return undefined
    }

    const rda = new web3.eth.Contract(MultisigRDA.abi, address)

    const dai = new web3.eth.Contract(GemLike.abi, addresses.dai)

    const promises = [
      await rda.methods.getParticipants().call(),
      await rda.methods.deposit().call(),
      await rda.methods.trusteeFee().call(),
      await rda.methods.trusteeFeePaid().call(),
      await rda.methods.landlordDamagePaid().call(),
      await rda.methods.getTransactionIds(true, true).call(),
      await rda.methods.dsrBalance().call(),
      await dai.methods.balanceOf(address).call()
    ]

    const results = await Promise.all(Object.values(promises))
    return {
      address,
      participants: results[0],
      deposit: results[1],
      fee: results[2],
      feePaid: results[3],
      damagesPaid: results[4],
      recordedActions: results[5],
      dsrBalance: (new web3.utils.BN(results[6])).add(new web3.utils.BN(1)).toString(), //round up
      daiBalance: results[7]
    }

  }

  getRda(address)
    .then(payload => {
      dispatch({
        type: RDA_SELECTED,
        payload
      })
    })
}

export const updateSelected = (payload) => (dispatch) => {
  dispatch({
    type: RDA_UPDATE_SELECTED,
    payload
  })
}

export const deselectRda = () => (dispatch) => {
  dispatch({
    type: RDA_SELECTED,
    payload: null
  })
}

