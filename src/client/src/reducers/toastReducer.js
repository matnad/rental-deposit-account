import {PUSH_TOAST, REMOVE_TOAST, TOGGLE_TOAST} from "../actions/types"

const initialState = []

export default function (state = initialState, action) {
  switch (action.type) {
    case PUSH_TOAST:
      return [
        ...state.map((toast) => toast), // Workaround, otherwise it will not compile *shrug*
        {
          show: true,
          title: action.payload.title,
          msg: action.payload.msg,
          time: Date.now(),
        }
      ];
    case TOGGLE_TOAST:
      return [
        ...state.map((toast) => toast.time === action.payload.time ? {...toast, show: false} : toast)
      ]
    case REMOVE_TOAST:
      return [
        ...state.filter((toast) => toast.time && toast.time !== action.payload.time)
      ]
    default:
      return state
  }
}
