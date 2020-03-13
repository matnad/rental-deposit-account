import {combineReducers} from "redux"
import authReducer from "./authReducer"
import rdaReducer from "./rdaReducer"
import transactionReducer from "./transactionReducer"

export default combineReducers({
  auth: authReducer,
  rda: rdaReducer,
  txn: transactionReducer
});
