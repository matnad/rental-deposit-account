import React, {Component} from "react"
import {connect} from "react-redux"
import {getEthereum} from "../utils/getEthereum"
import Web3 from "web3"
import {changeModal, changeStatus, updateTransaction} from "../actions/transactionActions"
import {getTransactionInfo, ModalType, Status} from "../utils/transactionProperties"
import {Box, Link, Text} from "rimble-ui"

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
            this.setState({intervalId, liveTxn})
            this.props.updateTransaction({
              gasPrice: this.state.web3.utils.fromWei(liveTxn.gasPrice, "ether")
            })
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
        window.toastProvider.addMessage(
          txnInfo.successToastTitle,
          {
            secondaryMessage: txnInfo.successToastSubTitle,
            variant: "success"
          })

      } else if(!liveTxn.status && !txn.reasonReported && txn.status === Status.REVERTED) {
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
      if (this.reloadCounter >= 2) {
        this.reloadCounter = 0
        this.state.web3.eth.getTransaction(this.props.txn.hash)
          .then((liveTxn) => this.setState({liveTxn}))
      }
      this.reloadCounter++
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
          <Box border="1px solid" borderColor={isCompleted ? "success" : "danger" } p={"0.5em"} bg="#1e1e1e">
            <Box>
              <Text fontSize={"0.8em"} fontWeight={"bold"}>Last Transaction</Text>
              <Text fontSize={"0.7em"}>{txnInfo.progressType}</Text>
            </Box>
            {/*<Box width={1} border="thin solid" borderColor="light-gray" mt={1}>*/}
            {/*  <Box bg={"success"} width={txn.progress} px={0} py={"0.3em"}/>*/}
            {/*</Box>*/}
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
    txn: state.txn
  })
}

export default connect(
  mapStateToProps,
  {updateTransaction, changeStatus, changeModal},
)(TransactionMaster)