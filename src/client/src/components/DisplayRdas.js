import React, {Component} from "react"
import {connect} from "react-redux"
import {Box, Button, Flex, Loader, Text} from "rimble-ui"
import {loadRdas} from "../actions/rdaActions"
import {Link} from "react-router-dom"
import {truncateAddress} from "../utils/string"

class DisplayRdas extends Component {

  constructor(props) {
    super(props)
    this.renderRdas = this.renderRdas.bind(this)
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const {account} = this.props.auth
    if (prevProps.auth.account !== account && account != null) {
      if (account) {
        this.props.loadRdas(account)
      }
    }
  }

  componentDidMount() {
    const {account} = this.props.auth
    if (account) {
      this.props.loadRdas(account)
    }
  }

  renderRdas() {
    const {contracts} = this.props.rda
    if (contracts.length === 0) {
      return null
    }
    return contracts.map((rda, index) => {
      return (<Flex key={index}>
          <Box width={1/2}>Address: {truncateAddress(rda)}</Box>
          <Box width={1/2}>... more info ...</Box>
        </Flex>
      )
    })
  }

  render() {
    const {account} = this.props.auth
    const {contracts, isLoading} = this.props.rda
    const nRda = contracts.length

    return (
      <>
        <Flex>
          <Box mb={4} width={1} textAlign="center">
            {
              account ?
                isLoading ?
                  <Loader size="1em" mr="auto" ml="auto"/> :
                  nRda === 0 ?
                    <Text fontWeight={"bold"}>No open Rental Deposit Contracts found for the current account.</Text> :
                    <Text
                      fontWeight={"bold"}>{`Your account has ${nRda} associated Rental Deposit Contract ${nRda > 1 ? 's' : ''}.`}</Text>
                : <Text fontWeight={"bold"}>Connect your account with MetaMask to view and create Rental Deposit
                  Accounts.</Text>
            }
          </Box>
        </Flex>
        <Flex>
          <Box width={1} textAlign="center">
            <Link to="/create">
              <Button.Outline width={1 / 2}>
                Open new Rental Deposit
              </Button.Outline>
            </Link>
          </Box>
        </Flex>
        <Flex>
          {
            isLoading ?
              null :
            <Box width={1} mt={4}>
              {this.renderRdas()}
            </Box>
          }
        </Flex>
      </>
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
  {loadRdas},
)(DisplayRdas)