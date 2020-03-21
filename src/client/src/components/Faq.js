import React, {Component} from "react"
import {connect} from "react-redux"
import {Box, Card, Text} from "rimble-ui"

class Faq extends Component {


  render() {
    // const {isLoading} = this.props.auth
    // if (isLoading) {
    //   return <PageLoader/>
    // }
    return (
      <Card
        width={3 / 4}
        mx={"auto"}
        bg={"dark-gray"}
        px={[3, 3, 4]}
        border={"none"}
      >
        <Box textAlign="center">
          <Text>Under construction</Text>
        </Box>
      </Card>
    )
  }
}

const mapStateToProps = (state) => {
  return ({
    auth: state.auth
  })
}

export default connect(
  mapStateToProps,
  {},
)(Faq)