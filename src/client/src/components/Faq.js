import React, {Component} from "react"
import {connect} from "react-redux"
import {Box, Card, Heading, Text} from "rimble-ui"

class Faq extends Component {

  renderQuestion(question, answer) {
    return (
      <Box my={2} p={2}>
        <Box
          border="1px dotted"
          mb={2}
          p={2}
        >
          <Text fontWeight="bold">{question}</Text>
        </Box>
        <Box px={2}>
          {answer}
        </Box>
      </Box>
    )
  }


  render() {
    return (
      <Card
        width={3 / 4}
        mx={"auto"}
        bg={"dark-gray"}
        px={[3, 3, 4]}
        border={"none"}
        borderRadius={7}
      >
        <Box textAlign="blockquote">
          <Box textAlign="center" mb={4}>
            <Heading>Frequently Asked Questions</Heading>
            <Text fontSize="0.8em"><i>(Under development)</i></Text>
          </Box>
          {this.renderQuestion(
            "Why do I need MetaMask to use this website?",
            <Text>MetaMask is a browser extension that allows you to directly connect to and
              interact with the Ethereum blockchain where our smart rental deposit accounts are located.
            </Text>)}
          {this.renderQuestion(
            "What is the trustee fee?",
            <Text>The trustee fee is a fixed payment to the trustee for his services:
              <ul style={{marginTop: "0.5em"}}>
                <li>Setting up the contract</li>
                <li>Confirming requests</li>
                <li>Providing Support</li>
              </ul>
              It is set at the start and will be paid from the accumulated interest before any
              interest can be withdrawn by the tenant. This happens without any involvement from the tenant.</Text>)}
          {this.renderQuestion(
            "What happens if the deposit is returned before the trustee fee has been paid off?",
            <Text>An amount equal to the remaining trustee fee will be withheld by the deposit if
              it is returned before the trustee fee is paid off. This amount can then be claimed by
              the trustee only. Note that this means the tenant pays the rest of the fee directly from his deposit.
            </Text>)}
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