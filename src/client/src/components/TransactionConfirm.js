import {Box, Button, Card, Flex, Heading, Icon, Image, Link, Loader, Modal, Text, Tooltip} from "rimble-ui"
import React, {Component} from "react"
import {connect} from "react-redux"
import {loadRdas} from "../actions/rdaActions"

import metamaskSvg from "../assets/images/MetaMaskIcon.svg"
import {getTransactionInfo, ModalType, Status} from "../utils/transactionProperties"
import {changeModal} from "../actions/transactionActions"
import {truncateAddress} from "../utils/string"
import {rowColors} from "../utils/settings"

let c = 0

class TransactionConfirm extends Component {

  getCostRow(type, eth, fiat) {
    if (eth <= 0 || !["price", "transaction"].includes(type)) {
      return ''
    }
    return (
      <Flex
        justifyContent={"space-between"}
        bg={rowColors[c++ % 2]}
        py={[2, 3]}
        px={3}
        alignItems={"center"}
        borderBottom={"1px solid gray"}
        borderColor={"moon-gray"}
        flexDirection={["column", "row"]}
      >
        <Flex alignItems={"center"}>
          <Text
            textAlign={["center", "left"]}
            color="near-black"
            fontWeight="bold"
          >
            {type === "price" ? "Price" : "Transaction Fee"}
          </Text>
          {type === "transaction" ?
            <Tooltip
              message="Pays the Ethereum network to process your transaction. Spent even if the transaction fails."
              position="top"
            >
              <Icon
                ml={1}
                name={"InfoOutline"}
                size={"14px"}
                color={"primary"}
              />
            </Tooltip> : ''}
        </Flex>
        <Flex
          alignItems={["center", "flex-end"]}
          flexDirection={["row", "column"]}
        >
          <Text
            mr={[2, 0]}
            color="near-black"
            fontWeight="bold"
            lineHeight={"1em"}
          >
            {eth} ETH
          </Text>
          <Text color="mid-gray" fontSize={1}>
            {fiat} CHF
          </Text>
        </Flex>
      </Flex>
    )
  }

  closeModal = () => this.props.changeModal(ModalType.NONE)

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.txn.status !== this.props.txn.status && this.props.txn.status === Status.PENDING) {
      // Wait 2 seconds, then change modals
      new Promise(resolve => {
        setTimeout(() => {
          if(this.props.txn.showModal === ModalType.CONFIRM) {
            this.props.changeModal(ModalType.PENDING)
          }
          resolve()
        }, 2000)
      })
    }
  }

  render() {
    const txn = this.props.txn
    const isShow = txn.showModal === ModalType.CONFIRM
    if (!isShow) return null

    c = 0
    const txnInfo = getTransactionInfo(txn.type)

    const status = txn.status
    const price = {
      eth: txn.price.toFixed(4),
      fiat: (txn.price * 100).toFixed(4)
    }

    const ethFee = (txn.gasPrice * txn.gasAmount)
    const fee = {
      eth: ethFee.toFixed(4),
      fiat: (ethFee * 100).toFixed(4)
    }

    const maxMins = Math.ceil(txn.estimatedTotalTime / 60)

    return (
      <Modal isOpen={isShow}>
        <Card borderRadius={1} border={1} borderColor="gray" p={0} bg="dark-gray" width={1} maxWidth="600px">
          <Flex
            justifyContent="space-between"
            alignItems="center"
            borderBottom={1}
            borderColor="gray"
            p={[3, 4]}
            pb={3}
          >
            <Image src={metamaskSvg} aria-label="MetaMask extension icon" size="24px"/>
            <Heading textAlign="center" as="h1" fontSize={[2, 3]} px={[3, 0]}>
              {txnInfo.confirmTitle}
            </Heading>
            <Link onClick={this.closeModal}>
              <Icon name="Close" color="moon-gray" aria-label="Close"/>
            </Link>
          </Flex>
          <Box p={[3, 4]}>
            <Flex justifyContent={"space-between"} flexDirection={"column"}>
              <Text textAlign="justify" mb={2}>
                {txnInfo.confirmSubTitle}
              </Text>
              {txn.status === Status.WAITING ?
                <>
                <Text textAlign="justify">
                  With the recommended gas price of {txn.gasPrice * Math.pow(10, 9)} GWEI,
                  your transaction should take less than {maxMins} minute{maxMins > 1 ? "s" : null} to complete.
                  You can adjust the gas price in MetaMask to make it faster but more expensive or slower but cheaper.
                </Text>
                {txn.gasPrice * Math.pow(10, 9) > 15 && txn.gasAmount > 1000000 ?
                    <Text mt={2} color="warning">
                      Warning: Gas costs are currently very high and your transaction requires a lot of gas.
                      If you can wait, consider executing the transaction later or with a lower gas price.
                      Currently {txn.gasPriceSafeLow * Math.pow(10, 9)} GWEI is a safe low gas price.{" "}
                      <Link color="silver" href={`https://ethgasstation.info/gasrecs.php`} target={"_blank"}>Read more
                        here.</Link>
                    </Text> : null
                }
                </> : null
              }
              <Flex
                alignItems={"stretch"}
                flexDirection={"column"}
                borderRadius={2}
                borderColor={"gray"}
                borderWidth={1}
                borderStyle={"solid"}
                overflow={"hidden"}
                my={[3, 4]}
              >
                <Box bg={"primary"} px={3} py={2}>
                  <Text color={"white"}>{txn.product}</Text>
                </Box>
                <Flex
                  p={3}
                  borderBottom={"1px solid gray"}
                  borderColor={"gray"}
                  alignItems={"center"}
                  flexDirection={["column", "row"]}
                >
                  {
                    status === Status.WAITING ?
                      <>
                        <Box
                          position={"relative"}
                          height={"2em"}
                          width={"2em"}
                          mr={[0, 3]}
                          mb={[3, 0]}
                        >
                          <Box position={"absolute"} top={"0"} left={"0"}>
                            <Loader size={"2em"}/>
                          </Box>
                        </Box>
                        <Box>
                          <Text
                            textAlign={["center", "left"]}
                            fontWeight={"600"}
                            fontSize={1}
                            lineHeight={"1.25em"}
                          >
                            Waiting for confirmation...
                          </Text>
                          <Link fontWeight={100} lineHeight={"1.25em"} color={"primary"}>
                            Don't see the MetaMask popup?
                          </Link>
                        </Box>
                      </>
                      : status === Status.REJECTED ?
                      <>
                        <Box
                          position={"relative"}
                          height={"2em"}
                          width={"2em"}
                          mr={[0, 3]}
                          mb={[3, 0]}
                        >
                          <Box position={"absolute"} top={"0"} left={"0"}>
                            <Icon name="Warning" color="danger" size={"2em"}/>
                          </Box>
                        </Box>
                        <Box>
                          <Text
                            textAlign={["center", "left"]}
                            fontWeight={"600"}
                            fontSize={1}
                            lineHeight={"1.25em"}
                          >
                            The transaction has been rejected
                          </Text>
                          <Link fontWeight={100} lineHeight={"1.25em"} color={"primary"}>
                            No account was opened and no funds were use.
                          </Link>
                        </Box>
                      </>
                      : status === Status.CONFIRMED || status === Status.PENDING ?
                        <>
                          <Box
                            position={"relative"}
                            height={"2em"}
                            width={"2em"}
                            mr={[0, 3]}
                            mb={[3, 0]}
                          >
                            <Box position={"absolute"} top={"0"} left={"0"}>
                              <Icon name="CheckCircle" color="success" size={"2em"}/>
                            </Box>
                          </Box>
                          <Box>
                            <Text
                              textAlign={["center", "left"]}
                              fontWeight={"600"}
                              fontSize={1}
                              lineHeight={"1.25em"}
                            >
                              The transaction has been confirmed!
                            </Text>
                            <Link fontWeight={100} lineHeight={"1.25em"} color={"primary"}>
                              It is now pending, click here to see the status.
                            </Link>
                          </Box>
                        </>
                        : null
                  }
                </Flex>
                <Flex
                  justifyContent={"space-between"}
                  bg={rowColors[c++ % 2]}
                  p={[2, 3]}
                  borderBottom={"1px solid gray"}
                  borderColor={"moon-gray"}
                  flexDirection={["column", "row"]}
                >
                  <Text
                    textAlign={["center", "left"]}
                    color="near-black"
                    fontWeight="bold"
                  >
                    Your account
                  </Text>
                  <Link
                    href={`https://rinkeby.etherscan.io/${txn.account}/`}
                    target={"_blank"}
                  >
                    <Tooltip message={txn.account}>
                      <Flex
                        justifyContent={["center", "auto"]}
                        alignItems={"center"}
                        flexDirection="row-reverse"
                      >
                        <Text fontWeight="bold">{truncateAddress(txn.account)}</Text>
                        <Flex
                          mr={2}
                          p={1}
                          borderRadius={"50%"}
                          bg={"primary-extra-light"}
                          height={"2em"}
                          width={"2em"}
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Icon color={"primary"} name="RemoveRedEye" size={"1em"}/>
                        </Flex>
                      </Flex>
                    </Tooltip>
                  </Link>
                </Flex>
                {this.getCostRow("price", price.eth, price.fiat)}
                {this.getCostRow("transaction", fee.eth, fee.fiat)}
                <Flex
                  justifyContent={"space-between"}
                  bg={rowColors[c++ % 2]}
                  p={[2, 3]}
                  alignItems={"center"}
                  flexDirection={["column", "row"]}
                >
                  <Text color="near-black" fontWeight="bold">
                    Estimated time
                  </Text>
                  <Text color={"mid-gray"}>
                    Less than {maxMins} minute{maxMins > 1 ? "s" : null} remaining
                  </Text>
                </Flex>
              </Flex>
              {
                status === Status.CONFIRMED || status === Status.REJECTED ?
                  <Button.Outline onClick={this.closeModal}>Close</Button.Outline> : null

              }
            </Flex>
          </Box>
        </Card>
      </Modal>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return ({
    auth: state.auth,
    txn: state.txn,
  })
}

export default connect(
  mapStateToProps,
  {loadRdas, changeModal},
)(TransactionConfirm)