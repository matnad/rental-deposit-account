import {DAI_PRICES_LOADED, ETH_PRICES_LOADED} from "../actions/types"


const initialState = {
  ethTo: {lastUpdate: null},
  daiTo: {lastUpdate: null}
}

export default function (state = initialState, action) {
  switch (action.type) {
    case ETH_PRICES_LOADED:
      return {
        ...state,
        ethTo: {
          ...state.ethTo,
          ...action.payload,
          lastUpdate: new Date(),
        }
      }
    case DAI_PRICES_LOADED:
      return {
        ...state,
        daiTo: {
          ...state.daiTo,
          ...action.payload,
          lastUpdate: new Date(),
        }
      }
    default:
      return state
  }
}
