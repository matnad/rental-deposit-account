import axios from "axios"
import {DAI_PRICES_LOADED, ETH_PRICES_LOADED} from "./types"
import {store} from "../store"

export const loadCoinbaseRates = () => dispatch => {
  let ethLastUpdate = null
  let timeSinceUpdateMs = 0
  try {
    ethLastUpdate = store.getState().oracle.ethTo.lastUpdate
    timeSinceUpdateMs = new Date() - new Date(ethLastUpdate)
  } catch (e) {
    // ignore
  }
  if (ethLastUpdate == null || timeSinceUpdateMs > 5 * 60 * 1000) {
    axios.get(`https://api.coinbase.com/v2/exchange-rates?currency=ETH`)
      .then(res => {
        if (res.status === 200) {
          dispatch({
            type: ETH_PRICES_LOADED,
            payload: res.data.data.rates
          })
        } else {
          console.log("Error updating ETH prices.")
        }
      })
      .catch(console.log)
  }

  let daiLastUpdate = null
  timeSinceUpdateMs = 0
  try {
    daiLastUpdate = store.getState().oracle.daiTo.lastUpdate
    timeSinceUpdateMs = new Date() - new Date(daiLastUpdate)
  } catch (e) {
    // ignore
  }
  if (daiLastUpdate == null || timeSinceUpdateMs > 5 * 60 * 1000) {
    axios.get(`https://api.coinbase.com/v2/exchange-rates?currency=DAI`)
      .then(res => {
        if (res.status === 200) {
          dispatch({
            type: DAI_PRICES_LOADED,
            payload: res.data.data.rates
          })
        } else {
          console.log("Error updating DAI prices.")
        }
      })
      .catch(console.log)
  }
}