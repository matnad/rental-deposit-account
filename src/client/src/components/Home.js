import React, {Component} from "react"
import {connect} from "react-redux"
import {Card, Text, Box} from "rimble-ui"
import DisplayRdas from "./DisplayRdas"
import PageLoader from "./PageLoader"
import {selectRda} from "../actions/rdaActions"
import {getAddress} from "../utils/getAddresses"

class Home extends Component {


  render() {
    const {isLoading} = this.props.auth
    if (isLoading) {
      return <PageLoader/>
    }
    const registryAddress = getAddress(this.props.auth.chainId, "reg")
    return (
      <Card
        width={3 / 4}
        mx={"auto"}
        bg={"dark-gray"}
        px={[3, 3, 4]}
        border={"none"}
      >
        {
          registryAddress ?
            <DisplayRdas/> :
            <Box textAlign="center">
              <Text fontWeight="bold">The Rental Deposit Account contract was not found on this network!</Text>
            </Box>

        }
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
)(Home)