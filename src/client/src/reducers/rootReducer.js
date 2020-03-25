import {combineReducers} from "redux"
import authReducer from "./authReducer"
import rdaReducer from "./rdaReducer"
import transactionReducer from "./transactionReducer"
import oracleReducer from "./oracleReducer"

export default combineReducers({
  auth: authReducer,
  rda: rdaReducer,
  txn: transactionReducer,
  oracle: oracleReducer,
});
