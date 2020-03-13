import React, {Component} from "react"
import {connect} from "react-redux"
import PropTypes from "prop-types"
import {Nav, Navbar} from "react-bootstrap"
import MetaMaskLoginButton from "./providers/metamask/MetaMaskLoginButton"
import TransactionConfirm from "./TransactionConfirm"


class TopNav extends Component {

  render() {
    const {pathname} = this.props.routeProps.location
    const {history} = this.props.routeProps

    return (
      <>
        <Navbar bg="dark-nav"
                variant="dark"
                fixed="top"
                style={{height: 70}}
                onSelect={(selected) => {
                  const to = "/" + selected
                  if (pathname !== to) {
                    history.push(to)
                  }
                }}>
          <Navbar.Brand href="home">Rental Deposit Account</Navbar.Brand>
          <Nav className="mr-auto">
            <Nav.Link href="transactions">Transactions</Nav.Link>
            <Nav.Link href="documents">Documents</Nav.Link>
          </Nav>
          <MetaMaskLoginButton/>
        </Navbar>
        <TransactionConfirm />
      </>

    )
  }

}

TopNav.propTypes = {
  routeProps: PropTypes.object.isRequired,
}

const mapStateToProps = (state, ownProps) => {
  return ({
    auth: state.auth,
  })
}

export default connect(
  mapStateToProps,
  {},
)(TopNav)