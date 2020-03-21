import React, {Component} from "react"
import {connect} from "react-redux"
import NoMetamask from "./NoMetamask"
import {withRouter} from "react-router-dom"

class Wrapper extends Component {

  render() {
    const {isMetaMask, isLoading} = this.props.auth

    if(isLoading) {
      return null
    }

    return (
      !isMetaMask && this.props.location.pathname !== "/faq" ?
        <NoMetamask/> :
        this.props.children
    )
  }

}

const mapStateToProps = (state) => {
  return ({
    auth: state.auth
  })
}

export default withRouter(connect(
  mapStateToProps,
  {},
)(Wrapper))