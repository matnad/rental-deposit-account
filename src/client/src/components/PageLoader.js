import React, {Component} from "react"
import {Box, Loader} from "rimble-ui"
class PageLoader extends Component {

  render() {
    return (
      <Box width={1} mt={5} textAlign="center">
        <Loader ml="auto" mr="auto" size="5em" />
      </Box>
    )
  }
}

export default PageLoader