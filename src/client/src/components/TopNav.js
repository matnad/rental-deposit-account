import React, {Component} from 'react'
import {connect} from "react-redux"
import PropTypes, {instanceOf} from "prop-types"
import {Button, Nav, Navbar} from "react-bootstrap"
import {loadWeb3, login} from "../actions/authActions"
import getWeb3 from "../getWeb3"

class TopNav extends Component {

  constructor(props) {
    super(props)
    this.loadWeb3 = this.loadWeb3.bind(this)
    this.unlockAccount = this.unlockAccount.bind(this)
    this.updateAddress = this.updateAddress.bind(this)
    this.state = {
      address: null
    }
  }

  componentDidMount = async () => {
    await this.loadWeb3()
    setInterval(this.updateAddress, 500)
  }

  async loadWeb3() {
    const web3 = await getWeb3()
    this.props.loadWeb3(web3)
    let acc = await web3.eth.getAccounts()
    if (instanceOf(acc, Array)) {
      acc = acc[0]
    }
    this.setState({address: acc})
    this.props.login(acc)
  }

  async updateAddress() {
    const currentAcc = this.props.auth.web3.currentProvider.selectedAddress
    if (currentAcc !== this.state.address) {
      this.setState({address: currentAcc})
      this.props.login(currentAcc)
    }
  }

  async unlockAccount() {
    try {
      await window.ethereum.enable()
    } catch (e) {
      console.log(e)
    }
  }


  render() {
    const {pathname} = this.props.routeProps.location
    const {history} = this.props.routeProps
    const {address} = this.props.auth

    return (
      <Navbar bg="dark-nav"
              variant="dark"
              fixed="top"
              onSelect={(selected) => {
                const to = '/' + selected
                if (pathname !== to) {
                  history.push(to)
                }
              }}>
        <Navbar.Brand href="home">Rental Deposit Account</Navbar.Brand>
        <Nav className="mr-auto">
          <Nav.Link href="transactions">Transactions</Nav.Link>
          <Nav.Link href="documents">Documents</Nav.Link>
        </Nav>
        {
          address ?
            address
            :
            <Button onClick={async () => {
              await this.unlockAccount()
            }}>Login</Button>
        }
      </Navbar>
    )
  }

}

TopNav.propTypes = {
  routeProps: PropTypes.object.isRequired
}

const mapStateToProps = (state, ownProps) => {
  return ({
    auth: state.auth
  })
}

export default connect(
  mapStateToProps,
  {loadWeb3, login}
)(TopNav)