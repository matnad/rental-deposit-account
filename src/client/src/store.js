import {createStore, applyMiddleware, compose} from 'redux'
import thunk from 'redux-thunk'
import rootReducer from "./reducers/rootReducer"
import {loadState, saveState} from "./utils/persistLocalStorage"
import throttle from 'lodash/throttle'


const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

const persistedSate = loadState()

const store = createStore(
  rootReducer,
  persistedSate,
  composeEnhancers(applyMiddleware(thunk))
)

store.subscribe(throttle(() => {
  saveState({
    txn: store.getState().txn,
    auth: store.getState().auth,
    rda: store.getState().rda,
    oracle: store.getState().oracle,
  })
}, 1000))

// Exports
export {
  store
}
