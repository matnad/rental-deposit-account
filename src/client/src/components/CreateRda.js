import {Box, Card} from "rimble-ui"
import React, {Component} from "react"
import {connect} from "react-redux"
import {createRdaTxn} from "../actions/transactionActions"
import RdaForm from "./RdaForm"
import PageLoader from "./PageLoader"
import {getEthereum} from "../utils/getEthereum"
import Web3 from "web3"

class CreateRda extends Component {

  constructor(props) {
    super(props);
    this.state = {
      web3: null
    }
  }

  componentDidMount = async () => {
    this.setState({web3: new Web3(await getEthereum())})
  }

  render() {
    if (this.props.auth.isLoading || !this.state.web3) {
      return <PageLoader/>
    }

    return (
      <Card
        width={3 / 4}
        mx={"auto"}
        bg={"dark-gray"}
        px={[3, 3, 4]}
        border={"none"}
      >
        <Box width={1} textAlign="center">
          <RdaForm web3={this.state.web3}/>
        </Box>
      </Card>
    )
  }

}

const mapStateToProps = (state, ownProps) => {
  return ({
    auth: state.auth,
    rda: state.rda,
    txn: state.txn,
  })
}

export default connect(
  mapStateToProps,
  {createRdaTxn},
)(CreateRda)
