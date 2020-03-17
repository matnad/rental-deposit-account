import {TRANSACTION_CREATED, TRANSACTION_MODAL_CHANGE, TRANSACTION_STATUS_CHANGE, TRANSACTION_UPDATE} from "./types"
import {ModalType, Status, TxnType} from "../utils/transactionProperties"
import RDARegistry from "../contracts/RDARegistry"
import {getEthereum} from "../utils/getEthereum"
import Web3 from "web3"
import axios from "axios"
import {desiredNetworks} from "../utils/settings"
import MultisigRDA from "../contracts/MultisigRDA"
import GemLike from "../contracts/GemLike"
import addresses from "../utils/addresses"


async function buildAndDispatchTransaction(dispatch, txn, rdaAddress, sender, functionName, args) {
  const web3 = new Web3(await getEthereum())
  web3.eth.handleRevert = true
  const chainId = (await web3.eth.net.getId()).toString()

  if (!desiredNetworks.includes(chainId)) {
    return undefined
  }
  txn = await updateGasPrice(web3, txn)
  const rda = new web3.eth.Contract(MultisigRDA.abi, rdaAddress)
  txn.gasAmount = await rda.methods[functionName](...args).estimateGas()


  dispatchTransaction(dispatch, txn, rda.methods[functionName], args, sender)
}

function dispatchTransaction(dispatch, txn, contractFunction, args, from) {
  dispatch({
    type: TRANSACTION_CREATED,
    payload: txn
  })
  contractFunction(...args).send({from})
    .on('transactionHash', (hash) => {
      dispatch({
        type: TRANSACTION_STATUS_CHANGE,
        payload: Status.PENDING
      })
      dispatch({
        type: TRANSACTION_UPDATE,
        payload: {hash, startedAt: new Date()}
      })
    })
    .on('error', (err, receipt) => {
      if (err.code === 4001) {
        dispatch({
          type: TRANSACTION_STATUS_CHANGE,
          payload: Status.REJECTED
        })
      } else {
        dispatch({
          type: TRANSACTION_STATUS_CHANGE,
          payload: Status.REVERTED
        })
        if (err.reason != null) {
          dispatch({
            type: TRANSACTION_UPDATE,
            payload: {revertReason: err.reason}
          })
        }
      }
    })
}

async function updateGasPrice(web3, txn) {

  const gasStation = (await axios.get(`https://ethgasstation.info/json/ethgasAPI.json`)).data
  const gasPriceWei = (gasStation.average * Math.pow(10, 8)).toString()

  txn.gasPriceSafeLow = (gasStation.safeLow * Math.pow(10, -10)).toString()
  txn.estimatedTotalTime = gasStation.avgWait * 60
  txn.remainingTime = txn.estimatedTotalTime
  txn.gasPrice = web3.utils.fromWei(gasPriceWei, "ether")

  return txn
}


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

export const updateTransaction = (payload) => dispatch => {
  dispatch({
    type: TRANSACTION_UPDATE,
    payload
  })
}

export const createRdaTxn = (tenant, landlord, trustee, trusteeFee, sender) => dispatch => {

  const txn = {
    hash: null,
    type: TxnType.CREATE_RDA,
    payload: {tenant, landlord, trustee, trusteeFee},
    account: sender,
    price: 0,
    gasAmount: 0,
    gasPrice: 0,
    gasPriceSafeLow: 0,
    startedAt: new Date(),
    estimatedTotalTime: 120,
    progress: 0,
    remainingTime: 120,
    showModal: ModalType.CONFIRM,
    status: Status.WAITING,
    // receipt: null,
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
      txn.gasPriceSafeLow = (gasStation.safeLow * Math.pow(10, -10)).toString()
      txn.estimatedTotalTime = gasStation.avgWait * 60
      txn.remainingTime = txn.estimatedTotalTime

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
          dispatch({
            type: TRANSACTION_UPDATE,
            payload: {hash, startedAt: new Date()}
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

export const withdrawInterest = (rdaAddress, sender) => (dispatch) => {
  const txn = {
    type: TxnType.WITHDRAW_INTEREST,
    account: sender,
    showModal: ModalType.CONFIRM,
    status: Status.WAITING,
  }
  buildAndDispatchTransaction(dispatch, txn, rdaAddress, sender,"withdrawInterest", [])
    .catch(console.log)
}

export const withdrawTrusteeFee = (rdaAddress, sender) => (dispatch) => {
  const txn = {
    type: TxnType.WITHDRAW_TRUSTEEFEE,
    account: sender,
    showModal: ModalType.CONFIRM,
    status: Status.WAITING,
  }
  buildAndDispatchTransaction(dispatch, txn, rdaAddress, sender,"withdrawTrusteeFee", [])
    .catch(console.log)
}

export const startRda = (rdaAddress, sender) => (dispatch) => {
  const txn = {
    type: TxnType.START,
    account: sender,
    showModal: ModalType.CONFIRM,
    status: Status.WAITING,
  }
  buildAndDispatchTransaction(dispatch, txn, rdaAddress, sender,"start", [])
    .catch(console.log)
}

export const fundContract = (amount, rdaAddress, sender) => (dispatch) => {
  const txn = {
    type: TxnType.FUND_CONTRACT,
    account: sender,
    dai: amount,
    showModal: ModalType.CONFIRM,
    status: Status.WAITING,
  }

  async function executeTransaction(txn, amount, sender) {
    const web3 = new Web3(await getEthereum())
    web3.eth.handleRevert = true
    const chainId = (await web3.eth.net.getId()).toString()
    if (!desiredNetworks.includes(chainId)) {
      throw new Error("Can't execute on this network. Switch to a supported one.")
    }

    const amountWei = web3.utils.toWei(amount, "ether")
    txn = await updateGasPrice(web3, txn)
    const dai = new web3.eth.Contract(GemLike.abi, addresses.dai)
    txn.gasAmount = await dai.methods.transfer(rdaAddress, amountWei).estimateGas()


    dispatchTransaction(dispatch, txn, dai.methods.transfer, [rdaAddress, amountWei], sender)
  }


  executeTransaction(txn, amount, sender)
    .catch(console.err)

}