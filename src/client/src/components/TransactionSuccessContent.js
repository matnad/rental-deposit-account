import React, {Component} from "react"
import {Box, Button, Card, Flex, Image, Text} from "rimble-ui"
import vault from "../assets/images/vault.png"
import dai from "../assets/images/dai.svg"
import {connect} from "react-redux"
import {selectRda} from "../actions/rdaActions"
import {getTransactionInfo, TxnType} from "../utils/transactionProperties"
import {withRouter} from "react-router-dom"
import {updateDaiBalance} from "../actions/authActions"
import Web3 from "web3"

class TransactionSuccessContent extends Component {

  componentDidMount() {
    if (this.props.rda.selected)
      switch (this.props.txn.type) {
        case TxnType.WITHDRAW_INTEREST:
          this.props.updateDaiBalance(this.props.auth.account)
          break
        case TxnType.FUND_CONTRACT:
          this.props.selectRda(this.props.rda.selected.address)
          break
        default:
          break
      }

  }

  getRda() {
    const {txn} = this.props
    if (!txn) return null
    const txnInfo = getTransactionInfo(TxnType.CREATE_RDA)
    // console.log(txn.payload.tenant, this.props.auth.account)
    const tenantInfo = txn.payload.tenant === this.props.auth.account ?
      <Text mt={3}>
        As the tenant, your next step should be to transfer the deposit in DAI to the account
        or to attach documents to the RDA.
      </Text>
      : null
    const landlordInfo = txn.payload.landlord === this.props.auth.account ?
      <Text mt={3}>
        As the landlord, your next step should be to wait for the rental deposit account to be started
        by the tenant or to attach documents like the rent contract to this account.
      </Text>
      : null
    const trusteeInfo = txn.payload.trustee === this.props.auth.account ?
      <Text mt={3}>
        As the trustee, your next steps should be to wait for the rental deposit account to be started
        by the tenant and to attach documents like the RDA contract to this account.
      </Text>
      : null
    return (
      <>
        <Box px={4} py={3}>
          <Flex mt={2} justifyContent="center">
            <Card p={3} borderRadius={16} bg={"gray"}>
              <Image src={vault} size="156px"/>
            </Card>
          </Flex>
          <Box textAlign="center" mt={4}>
            {tenantInfo}
            {landlordInfo}
            {trusteeInfo}
          </Box>
        </Box>
        <Flex
          pt={[4, 4]}
          pb={[4, 4]}
          p={[3, 4]}
          borderTop={1}
          borderColor="near-white"
          justifyContent="flex-end"
          flexDirection={["column", "row"]}
          alignItems="center"
        >
          {
            txnInfo.button && txn.type === TxnType.CREATE_RDA ?
              <Button.Outline
                mr={[0, 3]}
                mb={[2, 0]}
                width={["100%", "auto"]}
                onClick={() => {
                  this.props.selectRda(txn.receipt.logs[0].topics[1] || undefined)
                  this.props.closeFct()
                  // this.props.history.push("/details")
                }}
              >
                {txnInfo.button.text}
              </Button.Outline> : null
          }
          <Button width={["100%", "auto"]} onClick={this.props.closeFct}>Close</Button>
        </Flex>
      </>
    )
  }

  getInterest() {
    const {txn} = this.props
    if (!txn) return null
    // console.log(txn)
    // const txnInfo = getTransactionInfo(TxnType.CREATE_RDA)
    return (
      <>
        <Box px={4} py={3}>
          <Flex mt={2} justifyContent="center">
            <Card p={3} borderRadius={16} bg={"gray"}>
              <Image src={dai} size="156px"/>
            </Card>
          </Flex>
          <Box textAlign="center" mt={4}>
            <Text>X DAI has been withdrawn to your wallet!</Text>
          </Box>
        </Box>
        <Flex
          pt={[4, 4]}
          pb={[4, 4]}
          p={[3, 4]}
          borderTop={1}
          borderColor="near-white"
          justifyContent="flex-end"
          flexDirection={["column", "row"]}
          alignItems="center"
        >
          <Button width={["100%", "auto"]} onClick={this.props.closeFct}>Close</Button>
        </Flex>
      </>
    )
  }

  getFunded() {
    const {txn} = this.props
    if (!txn) return null

    const {selected} = this.props.rda
    let daiBalance = 0
    if (selected) {
      try {
        const web3 = new Web3(window.ethereum)
        daiBalance = Number.parseFloat(web3.utils.fromWei(selected.daiBalance, "ether").toString()).toFixed(2)
      } catch (e) {
        daiBalance = "<could not fetch>"
        console.log(e)
      }
    }

    return (
      <>
        <Box px={4} py={3}>
          <Flex mt={2} justifyContent="center">
            <Card p={3} borderRadius={16} bg={"gray"}>
              <Image src={dai} size="156px"/>
            </Card>
          </Flex>
          <Box textAlign="center" mt={4}>
            <Text>Your contract has been funded.</Text>
            <Text>{selected ? "DAI balance of the currently selected RDA: " + daiBalance : null}</Text>
          </Box>
        </Box>
        <Flex
          pt={[4, 4]}
          pb={[4, 4]}
          p={[3, 4]}
          borderTop={1}
          borderColor="near-white"
          justifyContent="flex-end"
          flexDirection={["column", "row"]}
          alignItems="center"
        >
          <Button width={["100%", "auto"]} onClick={this.props.closeFct}>Close</Button>
        </Flex>
      </>
    )
  }

  getStarted() {
    return (
      <>
        <Box px={4} py={3}>
          <Flex mt={2} justifyContent="center">
            <Card p={3} borderRadius={16} bg={"gray"}>
              <Image src={dai} size="156px"/>
            </Card>
          </Flex>
          <Box textAlign="center" mt={4}>
            <Text>There is nothing left for you to do except to wait for the interest to pile up.</Text>
            <Text>Can can check your current interest in the details tab.</Text>
          </Box>
        </Box>
        <Flex
          pt={[4, 4]}
          pb={[4, 4]}
          p={[3, 4]}
          borderTop={1}
          borderColor="near-white"
          justifyContent="flex-end"
          flexDirection={["column", "row"]}
          alignItems="center"
        >
          <Button width={["100%", "auto"]} onClick={this.props.closeFct}>Close</Button>
        </Flex>
      </>
    )
  }

  getRequest() {
    return (
      <>
        <Box px={4} py={3}>
          <Box textAlign="center" mt={4}>
            <Text>
              Your request is now open.<br/>
              Once your request is confirmed by one of the other participants, you can execute it.
              To track the progress, navigate to "Requests".
            </Text>
          </Box>
        </Box>
        <Flex
          pt={[4, 4]}
          pb={[4, 4]}
          p={[3, 4]}
          borderTop={1}
          borderColor="near-white"
          justifyContent="flex-end"
          flexDirection={["column", "row"]}
          alignItems="center"
        >
          <Button width={["100%", "auto"]} onClick={this.props.closeFct}>Close</Button>
        </Flex>
      </>
    )
  }

  getDocument() {
    return (
      <>
        <Box px={4} py={3}>
          <Box textAlign="center" mt={4}>
            <Text>
              Other participants can sign and verify it.
            </Text>
          </Box>
        </Box>
        <Flex
          pt={[4, 4]}
          pb={[4, 4]}
          p={[3, 4]}
          borderTop={1}
          borderColor="near-white"
          justifyContent="flex-end"
          flexDirection={["column", "row"]}
          alignItems="center"
        >
          <Button width={["100%", "auto"]} onClick={this.props.closeFct}>Close</Button>
        </Flex>
      </>
    )
  }

  getDefault() {
    return (
      <>
        <Box px={4} py={3}>
          {/*<Flex mt={2} justifyContent="center">*/}
          {/*  <Card p={3} borderRadius={16} bg={"gray"}>*/}
          {/*    <Image src={dai} size="156px"/>*/}
          {/*  </Card>*/}
          {/*</Flex>*/}
          <Box textAlign="center" mt={4}>
            <Text>Transaction was successfully completed!</Text>
          </Box>
        </Box>
        <Flex
          pt={[4, 4]}
          pb={[4, 4]}
          p={[3, 4]}
          borderTop={1}
          borderColor="near-white"
          justifyContent="flex-end"
          flexDirection={["column", "row"]}
          alignItems="center"
        >
          <Button width={["100%", "auto"]} onClick={this.props.closeFct}>Close</Button>
        </Flex>
      </>
    )
  }

  render() {
    if (this.props.auth.isLoading) return null
    switch (this.props.txnType) {
      case TxnType.CREATE_RDA:
        return this.getRda()
      case TxnType.WITHDRAW_INTEREST:
        return this.getInterest()
      case TxnType.FUND_CONTRACT:
        return this.getFunded()
      case TxnType.START:
        return this.getStarted()
      case TxnType.RETURN_DEPOSIT:
      case TxnType.PAY_DAMAGES:
      case TxnType.MIGRATE:
        return this.getRequest()
      case TxnType.ADD_DOCUMENT:
        return this.getDocument()
      default:
        return this.getDefault()
    }
  }
}

const mapStateToProps = (state) => {
  return ({
    auth: state.auth,
    txn: state.txn,
    rda: state.rda,
  })
}

export default withRouter(connect(
  mapStateToProps,
  {selectRda, updateDaiBalance},
)(TransactionSuccessContent))
