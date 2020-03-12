import {AUTH_ERROR, LOGIN_FAIL, LOGIN_SUCCESS, METAMASK_UPDATE} from "../actions/types"


const initialState = {
  address: null,
  isMetamask: true
}

export default function (state = initialState, action) {
  switch (action.type) {
    case METAMASK_UPDATE:
      return {
        ...state,
        isMetamask: action.payload,
      }
    case LOGIN_SUCCESS:
      return {
        ...state,
        address: action.payload
      }
    case AUTH_ERROR:
    case LOGIN_FAIL:
      return {
        ...state,
        address: null
      }
    default:
      return state
  }
}
