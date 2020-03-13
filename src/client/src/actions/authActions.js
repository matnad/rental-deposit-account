import {ACCOUNT_UPDATE, CHAINID_UPDATE, METAMASK_UPDATE, MM_LOADED} from "./types"

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
}
