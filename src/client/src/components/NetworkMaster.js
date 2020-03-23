import React, {Component} from "react"
import {connect} from "react-redux"
import {Box, Flex, Text, Tooltip, Icon, Loader} from "rimble-ui"
import {desiredNetworks, networkNames} from "../utils/settings"

class NetworkMaster extends Component {

  getNetworkIndicator(chainId) {
    // console.log(chainId)
    let chainName = "Unknown"
    if (chainId !== 0) chainName = networkNames[chainId]
    if (desiredNetworks.includes(chainId)) {
      return (
        <Box display="inline-block" width="140px" >
          <Flex flexDirection="column">
            <Text fontSize={1} color="silver" caps>
              Current Network
            </Text>
            <Tooltip message="You're on the right network">
              <Flex>
                <Text mr={2}>{chainName}</Text>
                <Icon name="CheckCircle" color="success" />
              </Flex>
            </Tooltip>
          </Flex>
        </Box>
      )
    } else {
      let tooltip = "You're on the wrong network – switch to"
      for (let i = 0; i < desiredNetworks.length; i++) {
        if (i === desiredNetworks.length-1) {
          tooltip += " or " + networkNames[desiredNetworks[i]]
        } else if(i === 0) {
          tooltip += " " + networkNames[desiredNetworks[i]]
        } else {
          tooltip += ", " + networkNames[desiredNetworks[i]]
        }
      }
      return (
        <Box display="inline-block" width="200px">
          <Flex flexDirection="column">
            <Text fontSize={1} color="silver" caps>
              Current Network
            </Text>
            <Tooltip message={tooltip}>
              <Flex>
                <Text mr={2}>{chainName}</Text>
                <Icon name="Error" color="danger"/>
              </Flex>
            </Tooltip>
          </Flex>
        </Box>
      )
    }
  }

  render() {
    const {isLoading, chainId} = this.props.auth
    if (isLoading) {
      return <Loader size={"1.5em"} style={{marginRight: 130}}/>
    }
    return (
      this.getNetworkIndicator(chainId)
    )
  }
}

const mapStateToProps = (state) => {
  return ({
    auth: state.auth,
  })
}


export default connect(
  mapStateToProps,
  {},
)(NetworkMaster)