import {TRANSACTION_CREATED, TRANSACTION_MODAL_CHANGE, TRANSACTION_STATUS_CHANGE} from "../actions/types"

export const TxnType = Object.freeze({
  INVALID: "invalid",
  CREATE_RDA:   "createRda",
  SUBMIT_TXN:  "submitTxn",
  CONFIRM_TXN: "confirmTxn"
});

export const ModalType = Object.freeze({
  NONE: "none",
  CONFIRM:   "confirm",
  PROGRESS:  "progress"
});

export const Status = Object.freeze({
  INVALID: "invalid",
  WAITING:   "waiting",
  CONFIRMED: "confirmed",
  REJECTED: "rejected",
  PENDING: "pending",
  REVERTED: "reverted",
  FAILED: "failed",
  COMPLETED: "completed"
});

const initialState = {
  hash: null,
  type: TxnType.INVALID,
  payload: {}, // type specific payload
  confirm: "Confirm your transaction in Metamask",
  product: "Transaction",
  title: "Transaction is on its way",
  subtitle: "Nice! The transaction will be processed shortly",
  progress: 0,
  account: null,
  price: 0,
  gasPrice: 0,
  gasAmount: 0,
  startedAt: new Date(),
  estimatedTotalTime: 0,
  showModal: ModalType.NONE,
  status: Status.INVALID
}

export default function (state = initialState, action) {
  switch (action.type) {
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
    default:
      return state
  }
}
