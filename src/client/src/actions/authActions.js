import {LOGIN_FAIL, LOGIN_SUCCESS, METAMASK_UPDATE} from "./types"

// Load Web3
// export const loadWeb3 = (web3) => dispatch => {
//   dispatch({
//     type: WEB3_LOADED,
//     payload: web3
//   })
// }


export const login = (acc) => dispatch => {
  if (acc != null) {
    dispatch({
      type: LOGIN_SUCCESS,
      payload: acc
    })
  } else {
    dispatch({
      type: LOGIN_FAIL,
      payload: acc
    })
  }
}

export const updateMetamask = (isMM) => dispatch => {
  dispatch({
    type: METAMASK_UPDATE,
    payload: isMM
  })
}
