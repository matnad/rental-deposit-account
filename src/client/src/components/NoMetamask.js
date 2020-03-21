import React, {Component} from "react"
import {Box, Card, Flex, Heading, Image, Text} from "rimble-ui"
import metamaskSvg from "../assets/images/MetaMaskIcon.svg"
import MetaMaskLoginButton from "./providers/metamask/MetaMaskLoginButton"

class NoMetamask extends Component {

  render() {
    return (
      <Card
        width={3/4}
        mx={"auto"}
        bg={"dark-gray"}
        px={[3, 3, 4]}
        border={"none"}
      >
        <Flex
          justifyContent="center"
          alignItems="center"
          borderBottom={1}
          borderColor="near-white"
          p={[3, 4]}
          pb={3}
        >
          <Box>
            <Flex>
            <Image
              src={metamaskSvg}
              aria-label="MetaMask extension icon"
              size="24px"
              mx="auto"
            />
            <Heading textAlign="center" as="h1" fontSize={[2, 3]} px={[3, 0]} mx={3}>
              Install MetaMask to use Rental Deposit Account
            </Heading>
            </Flex>
          </Box>
        </Flex>

        <Box p={[3, 4]} textAlign="blockquote">
          <Text mb={1}>
            MetaMask is a browser extension that will let you use our blockchain features in this browser.<br/>
            It may take you a few minutes to set up your MetaMask account.
          </Text>
        </Box>
        <Flex justifyContent="flex-end" borderTop={1} borderColor="light-gray" p={[3, 4]}>
          <MetaMaskLoginButton width={["100%", "auto"]}>
            Install MetaMask
          </MetaMaskLoginButton>
        </Flex>
      </Card>
    )
  }
}

export default NoMetamask