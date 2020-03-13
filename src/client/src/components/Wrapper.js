import React, {Component} from "react"
import {connect} from "react-redux"
import NoMetamask from "./NoMetamask"

class Wrapper extends Component {

  render() {

    const {isMetamask, address} = this.props.auth

    return (

      !isMetamask ?
        <NoMetamask/> :
        this.props.children
    )
  }

}

const mapStateToProps = (state, ownProps) => {
  return ({
    auth: state.auth
  })
}

export default connect(
  mapStateToProps,
  {},
)(Wrapper)