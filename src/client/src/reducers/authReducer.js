import {ACCOUNT_UPDATE, CHAINID_UPDATE, METAMASK_UPDATE, MM_LOADED} from "../actions/types"


const initialState = {
  isLoading: true,
  account: null,
  chainId: 0,
  isMetaMask: false,
}

export default function (state = initialState, action) {
  switch (action.type) {
    case METAMASK_UPDATE:
      return {
        ...state,
        account: action.payload ? state.account : null,
        networkId: action.payload ? state.networkId : 0,
        isMetaMask: action.payload,
      }
    case CHAINID_UPDATE:
      return {
        ...state,
        chainId: action.payload
      }
    case ACCOUNT_UPDATE:
      return {
        ...state,
        account: action.payload
      }
    case MM_LOADED:
      return {
        ...state,
        isLoading: false
      }
    default:
      return state
  }
}
