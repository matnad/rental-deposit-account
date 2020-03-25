import React, {Component} from "react"
import {connect} from "react-redux"
import NoMetamask from "./NoMetamask"
import {withRouter} from "react-router-dom"
import {loadCoinbaseRates} from "../actions/oracleActions"

class Wrapper extends Component {

  componentDidMount() {
    this.props.loadCoinbaseRates()
    this.interval = setInterval(this.props.loadCoinbaseRates, 6 * 60 * 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

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
  {loadCoinbaseRates},
)(Wrapper))