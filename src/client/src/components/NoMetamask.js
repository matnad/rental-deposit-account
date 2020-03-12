import React, {Component} from "react"
import {Box, Card, Flex, Heading, Icon, Image, Link, Text} from "rimble-ui"
import metamaskSvg from "../assets/images/MetaMaskIcon.svg"
import MetaMaskLoginButton from "./providers/metamask/MetaMaskLoginButton"

class NoMetamask extends Component {

    render() {
        return (
            <Card p={0} borderRadius={1} bg={"dark-gray"} border={"near-black"}>
                <Flex
                    justifyContent="space-between"
                    alignItems="center"
                    borderBottom={1}
                    borderColor="near-white"
                    p={[3, 4]}
                    pb={3}
                >
                    <Image
                        src={metamaskSvg}
                        aria-label="MetaMask extension icon"
                        size="24px"
                    />
                    <Heading textAlign="center" as="h1" fontSize={[2, 3]} px={[3, 0]}>
                        Install MetaMask to use Rental Deposit Account
                    </Heading>
                    <Link>
                        <Icon
                            name="Close"
                            color="moon-gray"
                            aria-label="Close and cancel connection"
                        />
                    </Link>
                </Flex>
                <Box p={[3, 4]}>
                    <Text mb={4}>
                        MetaMask is a browser extension that will let you use our blockchain
                        features in this browser. It may take you a few minutes to set up your
                        MetaMask account.
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