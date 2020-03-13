import {TRANSACTION_CREATED, TRANSACTION_MODAL_CHANGE, TRANSACTION_STATUS_CHANGE} from "./types"
import {ModalType, Status, TxnType} from "../reducers/transactionReducer"
import RDARegistry from "../contracts/RDARegistry"
import {getEthereum} from "../utils/getEthereum"
import Web3 from "web3"
import axios from "axios"


export const changeStatus = (newStatus) => dispatch => {
  dispatch({
    type: TRANSACTION_STATUS_CHANGE,
    payload: newStatus
  })
}

export const changeModal = (newModal) => dispatch => {
  dispatch({
    type: TRANSACTION_MODAL_CHANGE,
    payload: newModal
  })
}

export const createRdaTxn = (tenant, landlord, trustee, trusteeFee, sender) => dispatch => {

  const txn = {
    hash: null,
    type: TxnType.CREATE_RDA,
    payload: {tenant, landlord, trustee, trusteeFee},
    confirm: "Confirm in MetaMask to open an RDA",
    product: "Rental Deposit Account",
    title: "Your Rental Deposit Account is being opened",
    subtitle: "Very nice! It should be ready soon.",
    progress: 0,
    account: sender,
    price: 0,
    gasAmount: 0,
    gasPrice: 0,
    startedAt: new Date(),
    estimatedTotalTime: 120,
    showModal: ModalType.CONFIRM,
    status: Status.WAITING
  }


  async function getRegistry() {
    const web3 = new Web3(await getEthereum())
    const networkId = await web3.eth.net.getId()
    const deployedNetwork = RDARegistry.networks[networkId]
    const registry = new web3.eth.Contract(
      RDARegistry.abi,
      deployedNetwork && deployedNetwork.address,
    )

    let gasPriceWei
    try {
      const gasStation = (await axios.get(`https://ethgasstation.info/json/ethgasAPI.json`)).data
      gasPriceWei = (gasStation.average * Math.pow(10, 8)).toString()
      txn.estimatedTotalTime = gasStation.avgWait * 60

    } catch (e) {
      gasPriceWei = await web3.eth.getGasPrice()
    }


    // const gasPriceWei = await web3.eth.getGasPrice()
    txn.gasPrice = web3.utils.fromWei(gasPriceWei, "ether")
    txn.gasAmount = await registry.methods.createRDA(...Object.values(txn.payload))
      .estimateGas({from: txn.account, gasPrice: gasPriceWei})
    return registry
  }

  getRegistry()
    .then(registry => {
      dispatch({
        type: TRANSACTION_CREATED,
        payload: txn
      })

      registry.methods.createRDA(...Object.values(txn.payload)).send({from: txn.account})
        .on('transactionHash', (hash) => {
          dispatch({
            type: TRANSACTION_STATUS_CHANGE,
            payload: Status.PENDING
          })
        })
        .catch(err => {
          dispatch({
            type: TRANSACTION_STATUS_CHANGE,
            payload: Status.REJECTED
          })
        })
    })

}