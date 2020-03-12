import {combineReducers} from 'redux'
import toastReducer from "./toastReducer"
import authReducer from "./authReducer"

export default combineReducers({
  toasts: toastReducer,
  auth: authReducer
});
