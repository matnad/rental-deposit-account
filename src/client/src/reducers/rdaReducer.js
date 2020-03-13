import {RDAS_LOADED, RDAS_LOADING} from "../actions/types"


const initialState = {
  isLoading: true,
  contracts: []
}

export default function (state = initialState, action) {
  switch (action.type) {
    case RDAS_LOADING:
      return {
        ...state,
        isLoading: true
      }
    case RDAS_LOADED:
      return {
        ...state,
        contracts: action.payload,
        isLoading: false
      }
    default:
      return state
  }
}
