import React, {Component} from "react"
import {connect} from "react-redux"
import {Box, Card, Heading, Text} from "rimble-ui"
import PageLoader from "./PageLoader"
import {Redirect} from "react-router-dom"
import {getEthereum} from "../utils/getEthereum"
import Web3 from "web3"
import {loadConfirmations, selectRda} from "../actions/rdaActions"
import ConfirmationCard from "./RequestCard"
import {ConfirmationType} from "../utils/transactionProperties"

class Requests extends Component {

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
      this.props.loadConfirmations(this.props.rda.selected.address, "all")
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.rda.selected.address !== this.props.rda.selected.address &&
      this.props.rda.selected.address != null) {
      this.props.loadConfirmations(this.props.rda.selected.address, "all")
    }
  }

  renderRequests() {
    const {transactions} = this.props.rda.selected
    if (!transactions) return null
    if (transactions.filter(txn => txn.txnType !== ConfirmationType.DOCUMENT).length === 0) {
      return (
        <Box textAlign="center" mt={5} mb={4}>
          <Text fontSize="1.5em" fontWeight="bold">No request has been submitted so far.</Text>
        </Box>
      )
    }
    return transactions.map((txn, ix) => {
      if (txn.txnType !== ConfirmationType.DOCUMENT) {
        return <ConfirmationCard
          key={ix}
          index={ix}
          web3={this.state.web3}
        />
      }
      return ""
    })

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
            <Heading>Requests for Rental Deposit Account</Heading>
            <Text
              fontWeight="bold"
              my={[1, 1, 2]}
              mx="auto"
              width={[9 / 10, 9 / 10, 3 / 4]}
              address={rda.address}
            >{rda.address}</Text>
          </Box>
          <Box mb={4} textAlign="blockquote">
            <Box mx="auto" width={9 / 10}>
              <Text>
                Here you can see requests that require more than one confirmation before they can
                be executed. Confirming a request will never automatically execute it; this is a
                separate transaction. All requests are sorted chronologically with the newest on top.
                Before confirming a request, make sure you understand the consequences.
                For more details, please read the FAQ.
              </Text>
            </Box>
          </Box>
          {this.renderRequests()}
          <Box height="40px"/>
        </Box>
      </Card>
    )
  }
}

const mapStateToProps = (state) => {
  return ({
    auth: state.auth,
    rda: state.rda,
    txn: state.txn
  })
}

export default connect(
  mapStateToProps,
  {selectRda, loadConfirmations},
)(Requests)