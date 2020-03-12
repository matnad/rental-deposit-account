import {PUSH_TOAST, REMOVE_TOAST, TOGGLE_TOAST} from './types';

// PUSH NEW TOAST
export const pushToast = (title, msg) => {
  return {
    type: PUSH_TOAST,
    payload: { title, msg }
  };
};

// TOGGLE TOAST BY ID
export const toggleToast = (time) => {
  return {
    type: TOGGLE_TOAST,
    payload: {time}
  };
};

// REMOVE TOAST BY ID
export const removeToast = (time) => {
  return {
    type: REMOVE_TOAST,
    payload: {time}
  };
};
