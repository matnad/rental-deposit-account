import {
  RESET_CHAIN_CHANGE,
  TRANSACTION_CREATED,
  TRANSACTION_MODAL_CHANGE,
  TRANSACTION_STATUS_CHANGE,
  TRANSACTION_UPDATE
} from "../actions/types"

import {ModalType, Status, TxnType} from "../utils/transactionProperties"

const initialState = localStorage.getItem('txn') ||
  {
    hash: null,
    type: TxnType.INVALID,
    payload: {}, // type specific payload
    account: null,
    price: 0,
    gasPrice: 0,
    gasAmount: 0,
    startedAt: new Date(),
    estimatedTotalTime: 0,
    progress: 0,
    remainingTime: 0,
    showModal: ModalType.NONE,
    status: Status.INVALID,
    receipt: null,
    revertReason: undefined,
    reasonReported: false
  }

export default function (state = initialState, action) {
  switch (action.type) {
    case TRANSACTION_UPDATE:
      return {
        ...state,
        ...action.payload
      }
    case TRANSACTION_MODAL_CHANGE:
      return {
        ...state,
        showModal: action.payload
      }
    case TRANSACTION_STATUS_CHANGE:
      return {
        ...state,
        status: action.payload
      }
    case TRANSACTION_CREATED:
      return {
        ...initialState,
        ...action.payload
      }
    case RESET_CHAIN_CHANGE:
      return {
        ...initialState
      }
    default:
      return state
  }
}
