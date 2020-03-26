import {TRANSACTION_CREATED, TRANSACTION_MODAL_CHANGE, TRANSACTION_STATUS_CHANGE, TRANSACTION_UPDATE} from "./types"
import {ModalType, Status, TxnType} from "../utils/transactionProperties"
import RDARegistry from "../contracts/RDARegistry"
import {getEthereum} from "../utils/getEthereum"
import Web3 from "web3"
import axios from "axios"
import {desiredNetworks} from "../utils/settings"
import MultisigRDA from "../contracts/MultisigRDA"
import GemLike from "../contracts/GemLike"
import web3Utils from "web3-utils"
import {getAddress} from "../utils/getAddresses"


async function buildAndDispatchTransaction(dispatch, txn, rdaAddress, sender, functionName, args) {
  const web3 = new Web3(await getEthereum())
  web3.eth.handleRevert = true
  const chainId = (await web3.eth.net.getId()).toString()

  if (!desiredNetworks.includes(chainId)) {
    return undefined
  }

  txn = await updateGasPrice(web3, txn)
  const rda = new web3.eth.Contract(MultisigRDA.abi, rdaAddress)
  txn.gasAmount = await rda.methods[functionName](...args).estimateGas({from: sender})

  dispatchTransaction(dispatch, txn, rda.methods[functionName], args, sender)

  return rda
}

function dispatchTransaction(dispatch, txn, contractFunction, args, from) {
  dispatch({
    type: TRANSACTION_CREATED,
    payload: txn
  })
  const gasPriceWei = web3Utils.toWei(txn.gasPrice)
  contractFunction(...args).send({from, gasPrice: gasPriceWei})
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

export const updateEstTime = (gasPriceGwei) => dispatch => {

  axios.get(`https://ethgasstation.info/json/predictTable.json`)
    .then(res => {
      const {data} = res
      // console.log(data)
      if (data == null) return
      for (let i = 1; i < data.length; i++) {
        if (Number.parseFloat(gasPriceGwei) < data[i].gasprice) {
          // console.log(data[i-1])
          dispatch({
            type: TRANSACTION_UPDATE,
            payload: {estimatedTotalTime: data[i - 1].expectedWait * 60}
          })
          break
        }
      }
    })


}


export const createRdaTxn = (tenant, landlord, trustee, trusteeFee, sender) => dispatch => {

  const txn = {
    type: TxnType.CREATE_RDA,
    account: sender,
    showModal: ModalType.CONFIRM,
    status: Status.WAITING,
    payload: {tenant, landlord, trustee, trusteeFee},
  }


  async function getRegistry() {
    const web3 = new Web3(await getEthereum())
    const chainId = (await web3.eth.net.getId()).toString()
    const registry = new web3.eth.Contract(
      RDARegistry.abi,
      getAddress(chainId, "reg"),
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
      const gasPriceWei = web3Utils.toWei(txn.gasPrice)
      registry.methods.createRDA(...Object.values(txn.payload)).send({
        from: txn.account,
        gasPrice: gasPriceWei
      })
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
  buildAndDispatchTransaction(dispatch, txn, rdaAddress, sender, "withdrawInterest", [])
    .catch(console.log)
}

export const withdrawTrusteeFee = (rdaAddress, sender) => (dispatch) => {
  const txn = {
    type: TxnType.WITHDRAW_TRUSTEEFEE,
    account: sender,
    showModal: ModalType.CONFIRM,
    status: Status.WAITING,
  }
  buildAndDispatchTransaction(dispatch, txn, rdaAddress, sender, "withdrawTrusteeFee", [])
    .catch(console.log)
}

export const startRda = (rdaAddress, sender) => (dispatch) => {
  const txn = {
    type: TxnType.START,
    account: sender,
    showModal: ModalType.CONFIRM,
    status: Status.WAITING,
  }
  buildAndDispatchTransaction(dispatch, txn, rdaAddress, sender, "start", [])
    .catch(console.log)
}

export const returnDeposit = (rdaAddress, sender) => (dispatch) => {
  const txn = {
    type: TxnType.RETURN_DEPOSIT,
    account: sender,
    showModal: ModalType.CONFIRM,
    status: Status.WAITING,
  }
  buildAndDispatchTransaction(dispatch, txn, rdaAddress, sender, "submitTransactionReturnDeposit", [])
    // .then((rda) => {
    //   rda.once('Submission', {}, function (error, event) {
    //     // console.log(event)
    //     const {txnId} = event.returnValues
    //     // console.log(txnId)
    //     dispatch(loadConfirmations(rdaAddress, txnId))
    //   })
    // })
    .catch(console.log)
}

export const payDamages = (amount, rdaAddress, sender) => (dispatch) => {
  const txn = {
    type: TxnType.PAY_DAMAGES,
    account: sender,
    showModal: ModalType.CONFIRM,
    status: Status.WAITING,
    payload: {amount: `${amount} DAI`}
  }
  const amountWei = web3Utils.toWei(amount, "ether")
  buildAndDispatchTransaction(dispatch, txn, rdaAddress, sender, "submitTransactionPayDamages", [amountWei])
    // .then((rda) => {
    //   rda.once('Submission', {}, function (error, event) {
    //     const {txnId} = event.returnValues
    //     dispatch(loadConfirmations(rdaAddress, txnId))
    //   })
    // })
    .catch(console.log)
}

export const migrate = (newAddress, rdaAddress, sender) => (dispatch) => {
  const txn = {
    type: TxnType.MIGRATE,
    account: sender,
    showModal: ModalType.CONFIRM,
    status: Status.WAITING,
    payload: {newAddress}
  }

  try {
    newAddress = web3Utils.toChecksumAddress(newAddress)
  } catch (e) {
    console.log("Invalid migration target:", newAddress)
    return undefined
  }

  buildAndDispatchTransaction(dispatch, txn, rdaAddress, sender, "submitTransactionMigrate", [newAddress])
    // .then((rda) => {
    //   rda.once('Submission', {}, function (error, event) {
    //     const {txnId} = event.returnValues
    //     dispatch(loadConfirmations(rdaAddress, txnId))
    //   })
    // })
    .catch(console.log)

}

export const addDocument = (name, hash, rdaAddress, sender) => (dispatch) => {
  const txn = {
    type: TxnType.ADD_DOCUMENT,
    account: sender,
    showModal: ModalType.CONFIRM,
    status: Status.WAITING,
    payload: {name, hash}
  }

  buildAndDispatchTransaction(dispatch, txn, rdaAddress, sender, "submitTransactionDocument", [name, hash])
    // .then((rda) => {
    //   rda.once('Submission', {}, function (error, event) {
    //     const {txnId} = event.returnValues
    //     dispatch(loadConfirmations(rdaAddress, txnId))
    //   })
    // })
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

  async function fundIt(txn, amount, sender) {
    const web3 = new Web3(await getEthereum())
    web3.eth.handleRevert = true
    const chainId = (await web3.eth.net.getId()).toString()
    if (!desiredNetworks.includes(chainId)) {
      throw new Error("Can't execute on this network. Switch to a supported one.")
    }

    const amountWei = web3.utils.toWei(amount, "ether")
    txn = await updateGasPrice(web3, txn)
    const dai = new web3.eth.Contract(GemLike.abi, getAddress(chainId, "dai"))

    try {
      txn.gasAmount = await dai.methods.transfer(rdaAddress, amountWei).estimateGas({from: sender})
    } catch (e) {
      txn.gasAmount = 52000 // rough estimate for dai transfer if estimate function reverts
    }

    // // Catch event and refresh (need proper provider for events...)
    // dai.once('Transfer', {
    //   filter: {from: sender, to: rdaAddress, value: amount},
    // }, function (error, event) {
    //   dispatch(selectRda(rdaAddress))
    //   dispatch(updateDaiBalance(sender))
    // })
    // execute
    dispatchTransaction(dispatch, txn, dai.methods.transfer, [rdaAddress, amountWei], sender)

  }


  fundIt(txn, amount, sender)
    .catch(console.err)

}

export const confirmTransaction = (txnId, rdaAddress, sender) => (dispatch) => {
  const txn = {
    type: TxnType.CONFIRM,
    payload: {txnId},
    account: sender,
    showModal: ModalType.CONFIRM,
    status: Status.WAITING,
  }
  buildAndDispatchTransaction(dispatch, txn, rdaAddress, sender, "confirmTransaction", [txnId])
    // .then((rda) => {
    //   rda.once('Confirmation', {
    //     filter: {sender, txnId},
    //     fromBlock: "latest"
    //   }, (error, event) => {
    //     dispatch(loadConfirmations(rdaAddress, txnId))
    //   })
    //
    // })
    .catch(console.log)
}

export const revokeConfirmation = (txnId, rdaAddress, sender) => (dispatch) => {
  const txn = {
    type: TxnType.REVOKE,
    payload: {txnId},
    account: sender,
    showModal: ModalType.CONFIRM,
    status: Status.WAITING,
  }
  buildAndDispatchTransaction(dispatch, txn, rdaAddress, sender, "revokeConfirmation", [txnId])
    // .then((rda) => {
    //   rda.once('Revocation', {
    //     filter: {sender, txnId},
    //     fromBlock: "latest"
    //   }, (error, event) => {
    //     dispatch(loadConfirmations(rdaAddress, txnId))
    //   })
    // })
    .catch(console.log)
}

export const executeTransaction = (txnId, rdaAddress, sender) => (dispatch) => {
  const txn = {
    type: TxnType.EXECUTE,
    payload: {txnId},
    account: sender,
    showModal: ModalType.CONFIRM,
    status: Status.WAITING,
  }
  buildAndDispatchTransaction(dispatch, txn, rdaAddress, sender, "executeTransaction", [txnId])
    // .then((rda) => {
    //   rda.once('Execution', {
    //     filter: {txnId},
    //   }, function (error, event) {
    //     dispatch(selectRda(rdaAddress))
    //     dispatch(loadConfirmations(rdaAddress, txnId))
    //   })
    //   rda.once('ExecutionFailure', {
    //     filter: {txnId},
    //   }, function (error, event) {
    //     dispatch(selectRda(rdaAddress))
    //     dispatch(loadConfirmations(rdaAddress, txnId))
    //   })
    // })
    .catch(console.log)
}

