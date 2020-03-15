import React, {Component} from "react"
import {connect} from "react-redux"
import {Card} from "rimble-ui"
import DisplayRdas from "./DisplayRdas"
import PageLoader from "./PageLoader"
import {selectRda} from "../actions/rdaActions"

class Home extends Component {


  render() {
    const {isLoading} = this.props.auth
    if (isLoading) {
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
        <DisplayRdas/>
      </Card>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return ({
    auth: state.auth,
    rda: state.rda
  })
}

export default connect(
  mapStateToProps,
  {selectRda},
)(Home)