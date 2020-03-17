import React, {Component} from "react"
import {connect} from "react-redux"
import {Box, Button, Card, Flex, Heading, Text} from "rimble-ui"
import PageLoader from "./PageLoader"
import {rowColors} from "../utils/settings"
import {Redirect} from "react-router-dom"
import EthAddress, {CopyButton} from "./EthAddress"
import {getEthereum} from "../utils/getEthereum"
import Web3 from "web3"
import {selectRda} from "../actions/rdaActions"

let c = 0

class RdaDetails extends Component {

  constructor(props) {
    super(props)
    this.state = {
      web3: null
    }
  }

  componentDidMount = async () => {
    try {
      const ethereum = await getEthereum()
      this.setState({
        web3: new Web3(ethereum)
      })
    } catch (e) {
      console.log(e)
      // no provider
    }
    if (this.props.rda.selected.address) {
      this.props.selectRda(this.props.rda.selected.address)
    }
  }

  renderRow(leftText, rightText) {
    return (
      <Flex
        justifyContent={"space-between"}
        bg={rowColors[c++ % 2]}
        py={[2, 2]}
        px={[2, 3]}
        mx="1px"
        minHeight={"50px"}
        borderBottom={"1px solid gray"}
        // borderColor={"moon-gray"}
        flexDirection={["column", "row"]}
      >
        <Text
          textAlign={["center", "left"]}
          color="near-black"
          fontWeight="bold"
          my="auto"
        >
          {leftText}
        </Text>
        <Flex
          justifyContent={["center", "auto"]}
          alignItems={"center"}
        >
          <Text fontWeight="bold" color="near-black">{rightText}</Text>
        </Flex>
      </Flex>
    )
  }

  copiableAddress(address) {
    return (
      <Flex>
        <Text fontWeight="bold" my="auto" mr={2}>{address}</Text>
        <CopyButton
          clipboardText={address}
          textLabels={this.props.textLabel}
        />
      </Flex>
    )
  }

  render() {
    const {isLoading} = this.props.auth
    const rda = this.props.rda.selected
    const {web3} = this.state
    if (!web3) return null
    if (isLoading) {
      return <PageLoader/>
    } else if (!rda || !rda.address) {
      return <Redirect to={"/home"}/>
    }

    const remainingFee = new web3.utils.BN(rda.fee).sub(new web3.utils.BN(rda.feePaid))
    const rdaDeposit = Number.parseFloat(web3.utils.fromWei(rda.deposit, "ether")).toFixed(2)
    const dsrBalance = Number.parseFloat(web3.utils.fromWei(rda.dsrBalance, "ether")).toFixed(2)

    c = 0
    return (
      <Card
        width={[1, 1, 3 / 4]}
        mx={"auto"}
        bg={"dark-gray"}
        px={[1, 1, 3]}
        border={"none"}
      >
        <Box borderRadius={10} bg="blacks.4">
          <Box py={[1, 1, 3]} textAlign="center">
            <Heading>Rental Deposit Account</Heading>
            <EthAddress
              my={[1, 1, 2]}
              mx="auto"
              width={[9 / 10, 9 / 10, 3/4]}
              maxWidth="600px"
              address={rda.address}
            />
          </Box>
          <Box  mb={3} textAlign="center">
            <Box mx="auto" width={[9 / 10, 9 / 10, 1/2]}>
              <Flex justifyContent="space-between">
                <Button.Outline
                  width={["100%", "auto"]}
                  onClick={() => {
                    this.props.history.push("/actions")
                  }}
                >
                  Actions
                </Button.Outline>
                <Button.Outline
                  width={["100%", "auto"]}
                  onClick={() => {
                    this.props.history.push("/documents")
                  }}
                >
                  Documents
                </Button.Outline>
              </Flex>
            </Box>
          </Box>
          {this.renderRow("Status", rda.deposit > 0 ? "Running" : "Initialized")}
          <Box height="30px"/>
          {this.renderRow("Tenant", this.copiableAddress(rda.tenant))}
          {this.renderRow("Landlord", this.copiableAddress(rda.landlord))}
          {this.renderRow("Trustee", this.copiableAddress(rda.trustee))}
          <Box height="30px"/>
          {this.renderRow(
            "Remaining Trustee Fee",
            web3.utils.fromWei(remainingFee, "ether") + " DAI")
          }
          {this.renderRow("Deposit", rdaDeposit + " DAI")}
          {console.log(rda.dsrBalance)}
          {this.renderRow("DSR Balance", dsrBalance + " DAI")}
          <Box height="40px"/>
        </Box>
      </Card>
    )
  }
}

const mapStateToProps = (state) => {
  return ({
    auth: state.auth,
    rda: state.rda
  })
}

export default connect(
  mapStateToProps,
  {selectRda},
)(RdaDetails)