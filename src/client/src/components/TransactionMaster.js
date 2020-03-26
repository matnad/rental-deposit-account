import React, {Component} from "react"
import {connect} from "react-redux"
import {getEthereum} from "../utils/getEthereum"
import Web3 from "web3"
import web3Utils from "web3-utils"
import {changeModal, changeStatus, updateEstTime, updateTransaction} from "../actions/transactionActions"
import {getTransactionInfo, ModalType, Status, TxnType} from "../utils/transactionProperties"
import {Box, Link, Text} from "rimble-ui"
import {loadConfirmations, loadRdas, selectRda} from "../actions/rdaActions"
import {updateDaiBalance} from "../actions/authActions"

class TransactionMaster extends Component {

  constructor(props) {
    super(props)
    this.reloadCounter = 0
    this.getAndMonitorTxn = this.getAndMonitorTxn.bind(this)
    this.updateProgress = this.updateProgress.bind(this)
    this.state = {
      liveTxn: null,
      web3: null,
      intervalId: null
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.txn.hash !== this.props.txn.hash && this.state.web3) {
      if (this.props.txn.hash != null) {
        this.getAndMonitorTxn()
      } else {
        this.setState({liveTxn: null})
      }
    }
  }

  componentDidMount = async () => {
    const web3 = new Web3(await getEthereum())
    web3.eth.handleRevert = true
    this.setState({web3})
    this.getAndMonitorTxn()
  }

  componentWillUnmount() {
    if (this.state.intervalId) {
      clearInterval(this.state.intervalId)
    }
  }

  getAndMonitorTxn() {
    if (this.state.intervalId) {
      clearInterval(this.state.intervalId)
    }
    if (this.props.txn.hash) {
      const intervalId = setInterval(this.updateProgress, 500)
      if (this.state.web3) {
        this.state.web3.eth.getTransaction(this.props.txn.hash)
          .then((liveTxn) => {
            if (liveTxn != null) {
              this.setState({intervalId, liveTxn})
              this.props.updateTransaction({
                gasPrice: this.state.web3.utils.fromWei(liveTxn.gasPrice, "ether")
              })
            }
          })
      }
    }
  }

  updateProgress() {
    const {liveTxn, intervalId} = this.state
    if (liveTxn == null) {
      if (intervalId != null) clearInterval(intervalId)
      return
    }
    const txn = this.props.txn
    const txnInfo = getTransactionInfo(txn.type)
    if (liveTxn.blockHash != null) {
      // Transaction completed
      clearInterval(intervalId)

      if (txn.status === Status.PENDING) {
        this.props.changeStatus(Status.COMPLETED)
        this.reloadContent(txn)
        window.toastProvider.addMessage(
          txnInfo.successToastTitle,
          {
            secondaryMessage: txnInfo.successToastSubTitle,
            variant: "success"
          })

      } else if (!liveTxn.status && !txn.reasonReported && txn.status === Status.REVERTED) {
        window.toastProvider.addMessage(
          "Transaction Failed",
          {
            secondaryMessage: "Reason: " + txn.revertReason,
            variant: "failure"
          })
        this.props.updateTransaction({reasonReported: true})
      }
      this.state.web3.eth.getTransactionReceipt(liveTxn.hash)
        .then(receipt => {
          this.props.updateTransaction({receipt})
        })

    } else {
      const diffSecs = Math.floor((new Date() - new Date(txn.startedAt)) / 1000)
      const progress = Math.min(.99, 1 / txn.estimatedTotalTime * diffSecs)
      if (progress < 1) {
        const remainingTime = txn.estimatedTotalTime - diffSecs
        this.props.updateTransaction({progress, remainingTime})
      }
      if ((this.reloadCounter % 2) === 0) {
        this.state.web3.eth.getTransaction(this.props.txn.hash)
          .then((liveTxn) => {
            this.setState({liveTxn})
          })
      }
      if (this.reloadCounter === 0 || (this.reloadCounter % 6) === 0) {
        const gasPriceGwei = web3Utils.fromWei(liveTxn.gasPrice, "gwei")
        this.props.updateEstTime(gasPriceGwei)
      }
      this.reloadCounter++
    }
  }

  reloadContent(txn) {
    const rda = this.props.rda.selected
    switch (txn.type) {
      case TxnType.CREATE_RDA:
        this.props.loadRdas()
        break
      case TxnType.FUND_CONTRACT:
        this.props.updateDaiBalance(this.props.auth.account)
        if (rda && rda.address != null) {
          this.props.selectRda(rda.address)
        }
        break
      case TxnType.PAY_DAMAGES:
      case TxnType.MIGRATE:
      case TxnType.RETURN_DEPOSIT:
      case TxnType.ADD_DOCUMENT:
        if (rda && rda.address != null) {
          this.props.loadConfirmations(rda.address, "all")
        }
      // falls through
      default:
        if (rda && rda.address != null) {
          this.props.selectRda(rda.address)
          if (txn.payload && txn.payload.txnId) {
            this.props.loadConfirmations(rda.address, txn.payload.txnId)
          }
        }
    }
  }

  getBanner() {
    const {txn} = this.props
    const txnInfo = getTransactionInfo(txn.type)
    if (this.state.liveTxn && txn.status === Status.PENDING) {
      return (
        <Link onClick={() => {
          this.props.changeModal(ModalType.PROGRESS)
        }}>
          <Box border="1px solid" borderColor="light-gray" p={"0.5em"} bg="#1e1e1e">
            <Text fontSize={"0.8em"}>Current Tx: {txnInfo.progressType}</Text>
            <Box width={1} border="thin solid" borderColor="light-gray" mt={1}>
              <Box bg={"success"} width={txn.progress} px={0} py={"0.3em"}/>
            </Box>
          </Box>
        </Link>
      )
    } else if (txn.status === Status.COMPLETED || txn.status === Status.REVERTED) {
      const isCompleted = txn.status === Status.COMPLETED
      let modalType
      if (isCompleted) modalType = ModalType.SUCCESS
      else modalType = ModalType.ERROR
      return (
        <Link onClick={() => {
          this.props.changeModal(modalType)
        }}>
          <Box border="1px solid" borderRadius="10px" borderColor={isCompleted ? "success" : "danger"} p={"0.5em"}
               bg="#1e1e1e">
            <Box>
              <Text fontSize={"0.8em"} fontWeight={"bold"}>Last Transaction</Text>
              <Text fontSize={"0.7em"}>{txnInfo.progressType}</Text>
            </Box>
          </Box>
        </Link>
      )
    }
    return null
  }

  render() {
    return (
      this.getBanner()
    )
  }

}

const mapStateToProps = (state) => {
  return ({
    auth: state.auth,
    txn: state.txn,
    rda: state.rda,
  })
}

export default connect(
  mapStateToProps,
  {
    loadRdas,
    updateDaiBalance,
    updateTransaction,
    loadConfirmations,
    selectRda,
    updateEstTime,
    changeStatus,
    changeModal
  },
)(TransactionMaster)