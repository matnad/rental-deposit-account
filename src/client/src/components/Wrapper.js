import React, {Component} from "react"
import {connect} from "react-redux"
import NoMetamask from "./NoMetamask"

class Wrapper extends Component {

  render() {
    const {isMetaMask, isLoading} = this.props.auth

    if(isLoading) {
      return null
    }


    return (

      !isMetaMask ?
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