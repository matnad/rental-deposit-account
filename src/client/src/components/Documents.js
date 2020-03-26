import React, {Component} from "react"
import {connect} from "react-redux"
import {Box, Button, Card, Heading, Loader, Text} from "rimble-ui"
import PageLoader from "./PageLoader"
import {Redirect, withRouter} from "react-router-dom"
import {getEthereum} from "../utils/getEthereum"
import Web3 from "web3"
import {loadConfirmations, selectRda} from "../actions/rdaActions"
import ConfirmationCard from "./RequestCard"
import {ConfirmationType} from "../utils/transactionProperties"

class Documents extends Component {

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

  renderDocuments() {
    const {transactions} = this.props.rda.selected
    if (!transactions) return null
    if (transactions.filter(txn => txn.txnType === ConfirmationType.DOCUMENT).length === 0) {
      return (
        <Box textAlign="center" mt={5} mb={4}>
          {this.props.rda.selected.transactionsIsLoading ?
            <Loader size="2em" mx="auto"/> :
            <Text fontSize="1.5em" fontWeight="bold">No document has been submitted so far.</Text>}
        </Box>
      )
    }
    return transactions.map((txn, ix) => {
      if (txn.txnType === ConfirmationType.DOCUMENT) {
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
        borderRadius={7}
      >
        <Box borderRadius={10} bg="blacks.4">
          <Box py={[1, 1, 3]} textAlign="center">
            <Heading>Documents for Rental Deposit Account</Heading>
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
                Here is a list of documents that have been associated with this Rental Deposit Account.
                You can sign a document which is equal to putting your hand-written signature on a document.
                Once signed, you can never revoke your signature again.<br/>
                <br/>
                The documents are not stored online. Click the "Verify Document" button to select a file from your hard
                drive and
                the box will tell you if the file you selected is exactly the same as the document that was attached to
                this RDA.

              </Text>
            </Box>
          </Box>
          {this.renderDocuments()}
          <Box width={1} textAlign="center" mt={4}>
            <Button.Outline width={1 / 2} onClick={() => this.props.history.push("/documents/add")}>
              Add a new Document
            </Button.Outline>
          </Box>
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

export default withRouter(connect(
  mapStateToProps,
  {selectRda, loadConfirmations},
)(Documents))