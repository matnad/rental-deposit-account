import {
  ACCOUNT_UPDATE,
  CHAINID_UPDATE,
  DAIBALANCE_UPADTE,
  METAMASK_UPDATE,
  MM_LOADED,
  RESET_CHAIN_CHANGE
} from "./types"
import Web3 from "web3"
import {getEthereum} from "../utils/getEthereum"
import GemLike from "../contracts/GemLike"
import {store} from "../store"
import {getAddress} from "../utils/getAddresses"
import {loadRdas} from "./rdaActions"

export const loaded = () => dispatch => {
  dispatch({
    type: MM_LOADED
  })
}

export const updateAccount = (account) => dispatch => {
  dispatch({
    type: ACCOUNT_UPDATE,
    payload: account
  })
}

export const updateMetamask = (isMM) => dispatch => {
  dispatch({
    type: METAMASK_UPDATE,
    payload: isMM
  })
}

export const updateNetwork = (networkId) => dispatch => {
  dispatch({
    type: CHAINID_UPDATE,
    payload: networkId
  })
  dispatch({type: RESET_CHAIN_CHANGE})
  dispatch(loadRdas(store.getState().auth.account))
}

export const updateDaiBalance = (account) => (dispatch) => {
  if (account == null || account === "") {
    // dispatch({
    //   type: DAIBALANCE_UPADTE,
    //   payload: undefined
    // })
    return
  }
  getEthereum()
    .then(ethereum => {
      const daiAddress = getAddress(store.getState().auth.chainId, "dai")
      if (daiAddress == null) {
        return undefined
      }
      const dai = new (new Web3(ethereum)).eth.Contract(GemLike.abi, daiAddress)
      dai.methods.balanceOf(account).call()
        .then(balance => {
          dispatch({
            type: DAIBALANCE_UPADTE,
            payload: balance
          })
        })
    })

}

