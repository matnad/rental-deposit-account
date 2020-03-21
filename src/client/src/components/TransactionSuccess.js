import {Box, Card, Flex, Heading, Icon, Link, Modal, Text} from "rimble-ui"
import React, {Component} from "react"
import {connect} from "react-redux"
import {loadRdas, selectRda} from "../actions/rdaActions"
import {getTransactionInfo, ModalType} from "../utils/transactionProperties"
import {changeModal} from "../actions/transactionActions"
import TransactionSuccessContent from "./TransactionSuccessContent"
import {getEtherscanTx} from "../utils/settings"

class TransactionSuccess extends Component {

  closeModal = () => this.props.changeModal(ModalType.NONE)

  render() {
    const {txn} = this.props
    const isShow = txn.showModal === ModalType.SUCCESS
    if (!isShow) return null

    const txnInfo = getTransactionInfo(txn.type)

    const etherscanLink = getEtherscanTx(txn.hash, this.props.auth.chainId)

    return (
      <Modal isOpen={isShow}>
        <Card borderRadius={1} border={1} borderColor="gray" p={0} bg="dark-gray" width={1} maxWidth="600px">
          <Box height="4px" bg="success" borderRadius={["1rem 1rem 0 0"]}/>
          <Flex
            justifyContent="space-between"
            alignItems="center"
            borderBottom={1}
            borderColor="near-white"
            p={[3, 4]}
            pb={3}
          >
            <Icon name="CheckCircle" color="success" aria-label="Success"/>
            <Heading textAlign="center" as="h1" fontSize={[2, 3]} px={[3, 0]}>
              {txnInfo.successTitle}
            </Heading>
            <Link onClick={this.closeModal}>
              <Icon
                name="Close"
                color="moon-gray"
                aria-label="Close and cancel connection"
              />
            </Link>
          </Flex>
          {
            etherscanLink ?
              <Box pt={3} textAlign="center">
                <Link
                  href={etherscanLink}
                  target={"_blank"}
                >
                  <Text fontWeight="bold">Check Transaction on Etherscan</Text>
                </Link>
              </Box>
              : null
          }
          <TransactionSuccessContent txnType={txn.type} closeFct={this.closeModal}/>
        </Card>
      </Modal>
    )
  }
}

const mapStateToProps = (state) => {
  return ({
    auth: state.auth,
    txn: state.txn,
  })
}

export default connect(
  mapStateToProps,
  {loadRdas, changeModal, selectRda},
)(TransactionSuccess)