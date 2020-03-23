import React, {Component} from "react"
import {connect} from "react-redux"
import {Box, Text, Link} from "rimble-ui"
import {truncateAddress} from "../utils/string"
import {withRouter} from "react-router-dom"
import styled from "styled-components"

const HoverBox = styled(Box)`
	:hover {
		background-color: #1e1e1e;
		cursor: pointer;
	}
`

class SelectedRdaMaster extends Component {

  constructor(props) {
    super(props)
    this.state = {
      showMenu: false
    }
  }

  getBanner() {
    const {selected} = this.props.rda
    if (selected.address) {
      return (
        <Box
          position="absolute"
          onMouseEnter={() => {
            this.setState({showMenu: true})
          }}
          onMouseLeave={() => {
            this.setState({showMenu: false})
          }}
          pb={2}
          px={2}
          top={"12px"}
          // border={"1px solid red"}
        >
          <Link
            onClick={() => this.props.history.push("/details")}

          >
            <Box border="1px solid" borderColor="success" borderRadius="10px" p={"0.5em"} bg="#1e1e1e">
              <Box>
                <Text fontSize={"0.8em"} fontWeight={"bold"}>Selected RDA</Text>
                <Text fontSize={"0.7em"}>{selected.address ? truncateAddress(selected.address) : ''}</Text>
              </Box>
            </Box>
          </Link>
          {this.getMenu()}
        </Box>
      )
    } else {
      return null
    }
  }

  getMenu() {
    if (this.state.showMenu) {
      return (
        <Box
          className="menu"
          // position="absolute"
          bg="near-black"
          borderRadius={7}
          mt={1}
          ml={2}
        >
          <HoverBox
            onClick={() => this.goTo("/details")}
            px={3}
            py={1}
            borderRadius={7}
          >
            Details
          </HoverBox>
          <HoverBox
            onClick={() => this.goTo("/actions")}
            px={3}
            py={1}
            borderRadius={7}
          >
            Actions
          </HoverBox>
          <HoverBox
            onClick={() => this.goTo("/requests")}
            px={3}
            py={1}
            borderRadius={7}
          >
            Requests
          </HoverBox>
          <HoverBox
            onClick={() => this.goTo("/documents")}
            px={3}
            py={1}
            borderRadius={7}
          >
            Documents
          </HoverBox>
        </Box>
      )
    } else {
      return null
    }
  }

  goTo(page) {
    this.props.history.push(page)
    // this.setState({
    //   showMenu: false
    // })
  }

  render() {
    return (
      this.getBanner()
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
  null,
)(SelectedRdaMaster))