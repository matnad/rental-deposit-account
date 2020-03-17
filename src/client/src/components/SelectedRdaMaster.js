import React, {Component} from "react"
import {connect} from "react-redux"
import {Box, Text, Link} from "rimble-ui"
import {truncateAddress} from "../utils/string"
import {withRouter} from "react-router-dom"

class SelectedRdaMaster extends Component {

  getBanner() {
    const {selected} = this.props.rda
    if (selected.address) {
      return (
        <Link onClick={() => this.props.history.push("/details")}>
          <Box border="1px solid" borderColor="success" p={"0.5em"} bg="#1e1e1e">
            <Box>
              <Text fontSize={"0.8em"} fontWeight={"bold"}>Selected RDA</Text>
              <Text fontSize={"0.7em"}>{selected.address ? truncateAddress(selected.address) : ''}</Text>
            </Box>
          </Box>
        </Link>
      )
    } else {
      return null
    }
  }

  render() {
    return (
      this.getBanner()
    )
  }

}

const mapStateToProps = (state) => {
  return ({
    auth: state.auth,
    rda: state.rda
  })
}

export default withRouter(connect(
  mapStateToProps,
  null,
)(SelectedRdaMaster))