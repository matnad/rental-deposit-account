import React, {Component} from "react"
import {connect} from "react-redux"
import PropTypes from "prop-types"
import {Nav, Navbar} from "react-bootstrap"
import MetaMaskLoginButton from "./providers/metamask/MetaMaskLoginButton"
import TransactionConfirm from "./TransactionConfirm"
import TransactionProcessing from "./TransactionProcessing"
import TransactionMaster from "./TransactionMaster"
import {Box, Flex} from "rimble-ui"
import TransactionSuccess from "./TransactionSuccess"
import SelectedRdaMaster from "./SelectedRdaMaster"
import {Link} from 'react-router-dom'
import TransactionError from "./TransactionError"
import NetworkMaster from "./NetworkMaster"


class TopNav extends Component {

  render() {
    return (
      <>
        <Navbar bg="dark-nav"
                variant="dark"
                fixed="top"
                style={{height: 70}}
        >
          <Navbar.Brand as={Link} to="/home">Rental Deposit Account</Navbar.Brand>
          <Nav className="mr-auto">
            <Nav.Link as={Link} to="/faq">FAQ</Nav.Link>
          {
            this.props.rda.selected && this.props.rda.selected.address ?
              <>
                <Nav.Link as={Link} to="/details">Details</Nav.Link>
                <Nav.Link as={Link} to="/actions">Actions</Nav.Link>
                <Nav.Link as={Link} to="/requests">Requests</Nav.Link>
                <Nav.Link as={Link} to="/documents">Documents</Nav.Link>
              </>
              : null
          }
          </Nav>
          <Box width={1}>
            <Flex>
              <Box width={"80px"}/>
              <Flex>
                <Box mx={2}>
                  <TransactionMaster/>
                </Box>
                <Box mx={2}>
                  <SelectedRdaMaster/>
                </Box>
              </Flex>
            </Flex>
          </Box>
          <Box mx={2}>
            <NetworkMaster/>
          </Box>
          <MetaMaskLoginButton/>
        </Navbar>
        <TransactionConfirm/>
        <TransactionProcessing/>
        <TransactionSuccess/>
        <TransactionError/>
      </>
    )
  }

}

TopNav.propTypes = {
  routeProps: PropTypes.object.isRequired,
}

const mapStateToProps = (state) => {
  return ({
    auth: state.auth,
    rda: state.rda
  })
}

export default connect(
  mapStateToProps,
  {},
)(TopNav)
