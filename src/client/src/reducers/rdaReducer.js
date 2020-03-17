import {RDA_POPULATED, RDA_SELECTED, RDA_UPDATE_SELECTED, RDAS_LOADED, RDAS_LOADING} from "../actions/types"


const initialState = {
  isLoading: true,
  contracts: {},
  selected: {}
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
        isLoading: false
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
          recordedActions,
          dsrBalance,
          daiBalance
        } = action.payload
        selected = {
          address,
          participants,
          tenant: participants[0],
          landlord: participants[1],
          trustee: participants[2],
          deposit,
          fee,
          recordedActions,
          dsrBalance,
          daiBalance
        }
      }
      return {
        ...state,
        selected
      }
    default:
      return state
  }
}
