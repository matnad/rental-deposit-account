import {Box, Button, Card, Flex, Heading, Icon, Link, Modal, Text} from "rimble-ui"
import React, {Component} from "react"
import {connect} from "react-redux"
import {loadRdas, selectRda} from "../actions/rdaActions"
import {getTransactionInfo, ModalType} from "../utils/transactionProperties"
import {changeModal} from "../actions/transactionActions"
import {getErrorMessage} from "../utils/errorToText"

class TransactionError extends Component {

  closeModal = () => this.props.changeModal(ModalType.NONE)

  render() {
    const {txn} = this.props
    const isShow = txn.showModal === ModalType.ERROR
    if (!isShow) return null

    const txnInfo = getTransactionInfo(txn.type)

    return (
      <Modal isOpen={isShow}>
        <Card borderRadius={1} border={1} borderColor="gray" p={0} bg="dark-gray" width={1} maxWidth="600px">
          <Box height="4px" bg="danger" borderRadius={["1rem 1rem 0 0"]}/>
          <Flex
            justifyContent="space-between"
            alignItems="center"
            borderBottom={1}
            borderColor="near-white"
            p={[3, 4]}
            pb={3}
          >
            <Icon name="Warning" color="danger" size={"2em"} aria-label="warning"/>
            <Heading textAlign="center" as="h1" fontSize={[2, 3]} px={[3, 0]} color="danger">
              {txnInfo.failureTitle}
            </Heading>
            <Link onClick={this.closeModal}>
              <Icon
                name="Close"
                color="moon-gray"
                aria-label="Close and cancel connection"
              />
            </Link>
          </Flex>
          <>
            <Box px={4} py={3}>
              <Box textAlign="center" mt={4}>
                <Text>{getErrorMessage(txn)}</Text>
              </Box>
            </Box>
            <Flex
              p={[3, 4]}
              mt={3}
              borderTop={1}
              borderColor="near-white"
              justifyContent="flex-end"
              flexDirection={["column", "row"]}
              alignItems="center"
            >
              <Button width={["100%", "auto"]} onClick={this.closeModal}>Close</Button>
            </Flex>
          </>
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
)(TransactionError)