import React, {Component} from "react"
import {connect} from "react-redux"
import {Box, Button, Flex, Loader, Text} from "rimble-ui"
import {loadRdas, selectRda} from "../actions/rdaActions"
import {withRouter} from "react-router-dom"
import styled from 'styled-components'

const HoverBox = styled(Box)`
	:hover {
		background-color: #1e1e1e;
		cursor: pointer;
	}
`

class DisplayRdas extends Component {

  constructor(props) {
    super(props)
    this.renderRdas = this.renderRdas.bind(this)
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const {account} = this.props.auth
    if (prevProps.auth.account !== account && account != null  && prevProps.auth.account != null) {
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
    const {selected, contracts} = this.props.rda
    if (Object.keys(contracts).length === 0) {
      return null
    }
    const {account, isLoading} = this.props.auth
    return (
      <Box borderTop={"1px solid"}>
        {Object.values(contracts).map((rda, index) => {
          let role = <Loader ml="auto" mr="auto"/>
          if (rda.participants && !isLoading) {
            switch (account) {
              case rda.participants[0]:
                role = "You are the tenant."
                break
              case rda.participants[1]:
                role = "You are the landlord."
                break
              case rda.participants[2]:
                role = "You are the trustee."
                break
              default:
                role = "You are not directly involved."
            }
          }
          let weight = "regular"
          let bgColor = "none"
          const isSelected = rda.address === this.props.rda.selected.address
          if (isSelected) {
            weight = "bold"
            bgColor = "#1e1e1e"
          }

          return (
            <HoverBox
              key={index}
              py={2}
              bg={bgColor}
              onClick={() => {
                if (!selected.isLoading) {
                  isSelected ?
                    this.props.history.push("/details") :
                    this.props.selectRda(rda.address)
                }
              }}
              borderBottom={"1px solid"}
            >
              <Flex>
                <Box width={1 / 2}>
                  <Text fontWeight={weight}>{rda.address}</Text>
                </Box>
                <Box width={1 / 2} textAlign="center">
                  <Text fontWeight={weight}>{role}</Text>
                </Box>
              </Flex>
            </HoverBox>
          )
        })
        }
      </Box>
    )
  }

  render() {
    const {account} = this.props.auth
    const {selected, contracts, isLoading} = this.props.rda
    const nRda = Object.keys(contracts).length

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
                      fontWeight={"bold"}>{`Your account has ${nRda} associated Rental Deposit Contract${nRda > 1 ? 's' : ''}.`}</Text>
                : <Text fontWeight={"bold"}>Connect your account with MetaMask to view and create Rental Deposit
                  Accounts.</Text>
            }
          </Box>
        </Flex>
        <Flex>
          <Box width={1} textAlign="center">
              <Button.Outline width={1 / 2} onClick={() => this.props.history.push("/create")}>
                Open new Rental Deposit
              </Button.Outline>
          </Box>
        </Flex>
        <Flex>
          {
            isLoading || !account ?
              null :
              <Box
                width={1}
                py={2}
                verticalAlign="center"
              >
                {
                  selected.isLoading ?
                  <Box
                    position="absolute"
                    height="100%"
                    top={0}
                    pt="100px"
                    width={1}
                    verticalAlign="middle"
                  >
                    <Loader position="absolute" top="45%" left="45%" size="3em"/>
                  </Box>
                    : null
                }
                <Box zIndex="1" width={1} mt={4} opacity={selected.isLoading ? 0.1 : 1}>
                  {this.renderRdas()}
                </Box>

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

export default withRouter(connect(
  mapStateToProps,
  {loadRdas, selectRda},
)(DisplayRdas))