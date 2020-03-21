import {
  RDA_CONFIRMATIONS_LOADED,
  RDA_POPULATED,
  RDA_SELECTED,
  RDA_SELECTING,
  RDA_UPDATE_SELECTED,
  RDAS_LOADED,
  RDAS_LOADING,
  RESET_CHAIN_CHANGE
} from "../actions/types"

const initialState = {
  isLoading: true,
  contracts: {},
  selected: {
    isLoading: false,
    transactions: []
  }
}

export default function (state = initialState, action) {
  switch (action.type) {
    case RDAS_LOADING:
      return {
        ...state,
        isLoading: true
      }
    case RDAS_LOADED:
      const contractAddresses = action.payload
      const contracts = {}
      contractAddresses.forEach(address => {
        contracts[address] = {address}
      })
      return {
        ...state,
        contracts: contracts,
        isLoading: false,
        selected: {
          ...state.selected,
          isLoading: false
        }
      }
    case RDA_POPULATED:
      const {rdaAddress, rdaParticipants} = action.payload
      return {
        ...state,
        contracts: {
          ...state.contracts,
          [rdaAddress]: {
            ...state.contracts[rdaAddress],
            participants: rdaParticipants
          }
        }
      }
    case RDA_UPDATE_SELECTED:
      return {
        ...state,
        ...action.payload
      }
    case RDA_SELECTING:
      return {
        ...state,
        selected: {
          ...state.selected,
          isLoading: true
        }
      }
    case RDA_SELECTED:
      let selected
      if (!action.payload) {
        selected = {}
      } else {
        const {
          participants,
          address,
          deposit,
          fee,
          damagesPaid,
          recordedActions,
          dsrBalance,
          daiBalance,
          daiSavingRate,
        } = action.payload

        const dsrAPY = Math.pow(parseFloat(daiSavingRate) * Math.pow(10,-27), 60*60*24*365)
        selected = {
          ...state.selected,
          address,
          participants,
          tenant: participants[0],
          landlord: participants[1],
          trustee: participants[2],
          deposit,
          fee,
          damagesPaid,
          recordedActions,
          dsrBalance,
          daiBalance,
          dsrAPY,
          isLoading: false
        }
      }
      return {
        ...state,
        selected
      }
    case RDA_CONFIRMATIONS_LOADED:
      if (Array.isArray(action.payload)) {
        // Overwrite
        return {
          ...state,
          selected: {
            ...state.selected,
            transactions: action.payload
          }
        }
      } else {
        // Replace or extend
        let txns = state.selected.transactions
        if (!txns) txns = []
        for (let i = 0; i < txns.length; i++) {
          if (txns[i].id === action.payload.id) {
            txns[i] = action.payload
            break
          }
          if (i === txns.length - 1) {
            // not found
            txns.push(action.payload)
          }
        }
        return {
          ...state,
          selected: {
            ...state.selected,
            transactions: txns
          }
        }
      }
    case RESET_CHAIN_CHANGE:
      return {
        ...initialState
      }
    default:
      return state
  }
}
