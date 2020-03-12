import {AUTH_ERROR, LOGIN_FAIL, LOGIN_SUCCESS, WEB3_FAILED, WEB3_LOADED} from '../actions/types'


const initialState = {
  web3: null,
  address: null
}

export default function (state = initialState, action) {
  switch (action.type) {
    case WEB3_LOADED:
      return {
        ...state,
        web3: action.payload,
      }
    case WEB3_FAILED:
      return {
        ...state,
        web3: null
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
