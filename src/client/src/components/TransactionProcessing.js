import {Box, Button, Card, Flex, Heading, Icon, Link, Loader, Modal, Text, Tooltip} from "rimble-ui"
import React, {Component} from "react"
import {connect} from "react-redux"
import {getTransactionInfo, ModalType, Status} from "../utils/transactionProperties"
import {fiatCurrency, getEtherscanTx, rowColors} from "../utils/settings"
import {truncateAddress} from "../utils/string"
import {changeModal} from "../actions/transactionActions"

let c = 0

class TransactionProcessing extends Component {

  getCostRow(type, amountCrypto, fiat) {
    if (isNaN(amountCrypto) || amountCrypto <= 0 || !["dai", "eth", "transaction"].includes(type)) {
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
            {type === "eth" || type === "dai" ? "Tokens Transferred" : "Transaction Fee"}
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
            {amountCrypto} {type === "eth" ? "ETH" : type === "dai" ? "DAI" : "ETH"}
          </Text>
          <Text color="mid-gray" fontSize={1}>
            {fiat} CHF
          </Text>
        </Flex>
      </Flex>
    )
  }

  closeModal = () => this.props.changeModal(ModalType.NONE)

  render() {
    c = 0
    const txn = this.props.txn
    const isShow = txn.showModal === ModalType.PROGRESS && txn.status === Status.PENDING
    if (!isShow) return null

    const txnInfo = getTransactionInfo(txn.type)

    let ethToChf = 0
    let daiToChf = 0
    try {
      ethToChf = this.props.oracle.ethTo[fiatCurrency]
    } catch (e) {
      console.log("Could not get ETH conversion rates")
    }
    try {
      daiToChf = this.props.oracle.daiTo[fiatCurrency]
    } catch (e) {
      console.log("Could not get DAI conversion rates")
    }

    const price = {
      dai: Number.parseFloat(txn.dai).toFixed(2),
      eth: Number.parseFloat(txn.eth).toFixed(5),
      daiFiat: (Number.parseFloat(txn.dai) * daiToChf).toFixed(2),
      ethFiat: (Number.parseFloat(txn.eth) * ethToChf).toFixed(2)
    }

    const ethFee = (txn.gasPrice * txn.gasAmount)
    const fee = {
      eth: ethFee.toFixed(4),
      fiat: (ethFee * ethToChf).toFixed(4)
    }

    const maxMins = Math.max(1, Math.ceil(txn.remainingTime / 60))
    const etherscanLink = getEtherscanTx(txn.hash, this.props.auth.chainId)

    return (
      <Modal isOpen={isShow}>
        <Card borderRadius={1} border={1} borderColor="gray" p={0} bg="dark-gray" width={1} maxWidth="600px">
          <Flex
            justifyContent="space-between"
            alignItems="center"
            borderBottom={1}
            borderColor="near-white"
            p={[3, 4]}
            pb={3}
          >
            <Loader aria-label="Processing" size="24px"/>
            <Heading textAlign="center" as="h1" fontSize={[2, 3]} px={[3, 0]}>
              {txnInfo.pendingTitle}
            </Heading>
            <Link onClick={this.closeModal}>
              <Icon name="Close" color="moon-gray" aria-label="Close"/>
            </Link>
          </Flex>
          <Box p={[3, 4]}>
            <Flex justifyContent={"space-between"} flexDirection={"column"}>
              <Text textAlign="center">{txnInfo.pendingSubtitle}</Text>
              {
                txn.progress >= 0.99 ?
                  <Text textAlign="center" color="warning">
                    <br/>The displayed progress is just our best estimate,
                    the actual time can differ significantly. We will inform you, when the transaction is complete.
                  </Text> : null
              }
              <Flex
                alignItems={"stretch"}
                flexDirection={"column"}
                borderRadius={2}
                borderColor={"moon-gray"}
                borderWidth={1}
                borderStyle={"solid"}
                overflow={"hidden"}
                my={[3, 4]}
              >
                <Box bg={"success"} width={txn.progress} px={2} py={2}/>
                <Flex
                  bg="primary"
                  p={3}
                  borderBottom={"1px solid gray"}
                  borderColor={"moon-gray"}
                  alignItems={"center"}
                  justifyContent={"space-between"}
                  flexDirection={["column", "row"]}
                >
                  <Box height={"2em"} width={"2em"} mr={[0, 3]} mb={3}>
                    <Flex
                      bg={"dark-gray"}
                      borderRadius={"50%"}
                      height={"3em"}
                      width={"3em"}
                      justifyContent={"center"}
                      alignItems={"center"}
                    >
                      <Text>{Math.ceil(txn.progress * 100)}%</Text>
                    </Flex>
                  </Box>

                  <Box>
                    <Text
                      textAlign={["center", "left"]}
                      color="near-white"
                      ml={[0, 3]}
                      my={[1, 0]}
                      fontSize={3}
                      lineHeight={"1.25em"}
                    >
                      Processing...
                    </Text>
                  </Box>
                  {
                    etherscanLink ?
                      <Box>
                        <Flex flexDirection="row" alignItems="center">
                          <Link
                            color="near-white"
                            ml={[0, 3]}
                            fontSize={1}
                            lineHeight={"1.25em"}
                            href={etherscanLink}
                            target="_blank"
                          >
                            Details
                            <Icon
                              ml={1}
                              color="near-white"
                              name="Launch"
                              size="14px"
                            />
                          </Link>
                        </Flex>
                      </Box>
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
                    href={"https://etherscan.io/" + txn.account}
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

                {this.getCostRow("dai", price.dai, price.daiFiat)}
                {this.getCostRow("eth", price.eth, price.ethFiat)}
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
                    {
                      maxMins >= 600 ?
                        `Low gas price... might take very long` :
                      `Less than ${maxMins} minute${maxMins > 1 ? "s" : null} remaining`
                    }
                  </Text>
                </Flex>
              </Flex>

              <Button.Outline onClick={this.closeModal}>Hide</Button.Outline>
            </Flex>
          </Box>
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
  {changeModal},
)(TransactionProcessing)