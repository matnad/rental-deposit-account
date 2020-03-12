import React, {Component} from "react"
import {connect} from "react-redux"
import {Box, Card, Flex, Heading, Icon, Image, Link, Loader, MetaMaskButton, Modal, Text, Button} from "rimble-ui"
import styled from "styled-components"
import metamaskSvg from "../../../assets/images/MetaMaskIcon.svg"
import {login, updateMetamask} from "../../../actions/authActions"

let detect = require("detect-browser").detect

let isMobile
const desiredNetworks = ["1", "999"]
const networks = {
    "1": "Ethereum Main Net",
    "42": "Kovan",
    "3": "Ropsten",
    "4": "Rinkeby",
    "999": "Custom RPC",
}

const LoginMMButton = styled(MetaMaskButton)`
  & {
    height: 37px;
  }
`

const LoggedInMMButton = styled(LoginMMButton)`
  & {
    padding: 15px;
    border-radius: 150px;
  }
  &:hover {
    background-color: #000;
  }
  
`

class MetaMaskLoginButton extends Component {
    constructor(props, context) {
        super(props, context)

        this.handleClick = this.handleClick.bind(this)
        this.mount = this.mount.bind(this)
        this.init = this.init.bind(this)

        this.state = {
            loading: true,
            install: false,
            address: null,
            showConnectModal: false,
            isConnectionError: false,
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(prevState.install !== this.state.install) {
            alert(this.state.install)
            this.props.updateMetamask(this.state.install)
        }
    }

    componentWillMount() {
        if (window.web3.currentProvider.isMetaMask) {
            this.setState({install: false})
            window.ethereum.on("networkChanged", network => {
                const name = networks[network] || "Network"
                if (!desiredNetworks.includes(network) && this.state.address) {
                    window.toastProvider.addMessage(
                        `${name} not supported`,
                        {secondaryMessage: "Use Ethereum Main Net or Custom RPC", variant: "failure"},
                    )
                }
            })
            window.ethereum.on("accountsChanged", accounts => {
                if (accounts.length < 1) {
                    this.setState({
                        address: null,
                        loading: false,
                    })
                } else {
                    const {address} = this.props.auth
                    this.setState({
                        address: accounts[0],
                        loading: false,
                    })
                    this.props.login(accounts[0])
                    if (address && accounts[0] !== address) {
                        window.toastProvider.addMessage(
                            `Account switched to`,
                            {secondaryMessage: MetaMaskLoginButton.truncateAddress(accounts[0]), variant: "success"},
                        )
                    }
                }
            })
        } else {
            this.setState({install: true})
        }
    }

    handleClick() {
        if (this.state.address) {
            //TODO: What happens when clicking on it while logged in?
            window.toastProvider.addMessage(
                `Use MetaMask to switch accounts`,
                {variant: "default", icon: "InfoOutline"},
            )
        } else {
            this.mount()
        }
    }

    mount() {
        if (window.web3.currentProvider.isMetaMask) {
            this.init()
        } else {
            const browser = detect()

            isMobile = !!detectMobile()

            function detectMobile() {
                return (
                    navigator.userAgent.match(/Android/i) ||
                    navigator.userAgent.match(/webOS/i) ||
                    navigator.userAgent.match(/iPhone/i) ||
                    navigator.userAgent.match(/iPad/i) ||
                    navigator.userAgent.match(/iPod/i) ||
                    navigator.userAgent.match(/BlackBerry/i) ||
                    navigator.userAgent.match(/Windows Phone/i)
                )
            }

            if (!isMobile) {
                switch (browser.name) {
                    case "firefox":
                        window.open(
                            "https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/",
                            "_blank",
                        )

                        break

                    case "chrome":
                        window.open(
                            "https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en",
                            "_blank",
                        )
                        break

                    case "opera":
                        window.open(
                            "https://addons.opera.com/en/extensions/details/metamask/",
                            "_blank",
                        )

                        break
                    default:
                        break
                }
            }
        }
    }

    async init() {
        this.setState({
            isConnectionError: false,
            showConnectModal: true,
        })
        try {
            await window.ethereum.enable()
            window.toastProvider.addMessage(
                `Connected to MetaMask`,
                {variant: "success"},
            )
        } catch (error) {
            window.toastProvider.addMessage(
                "Connection Failed",
                {secondaryMessage: "Check console for details.", variant: "failure"},
            )
            this.setState({isConnectionError: true})
        }
    }

    connectModal() {
        const {address} = this.state
        return (
            <Modal isOpen={this.state.showConnectModal}>
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
                            Confirm connection in MetaMask
                        </Heading>
                        <Link onClick={() => this.setState({showConnectModal: false})}>
                            <Icon
                                name="Close"
                                color="moon-gray"
                                aria-label="Close and cancel connection"
                            />
                        </Link>
                    </Flex>
                    <Box p={[3, 4]}>
                        <Text textAlign="center">
                            Confirm the request that's just appeared. If you can't see a request, open
                            your MetaMask extension via your browser.
                        </Text>
                    </Box>
                    <Box px={[3, 4]} pb={[3, 4]}>
                        <Flex
                            flexDirection={["column", "row"]}
                            bg={"primary-2x-light"}
                            p={[3, 4]}
                            alignItems={["center", "auto"]}
                        >
                            {address ?
                                <>
                                    <Icon name="CheckCircle" color="success" size={"3em"} mr={[0, 3]} mb={[2, 0]}/>
                                    <Flex flexDirection="column" alignItems={["center", "flex-start"]}>
                                        <Text fontWeight={4}>Connection confirmed!</Text>
                                        <Text fontWeight={2}>You can now use all the features of this
                                            website!</Text>
                                    </Flex>
                                </>
                                : this.state.isConnectionError ?
                                    <>
                                        <Icon name="Warning" color="danger" size={"3em"} mr={[0, 3]} mb={[2, 0]}/>
                                        <Flex flexDirection="column" alignItems={["center", "flex-start"]}>
                                            <Text fontWeight={4}>Connection refused</Text>
                                            <Text fontWeight={2}>Without connecting your Account, you can't use this website.</Text>
                                        </Flex>
                                    </>
                                    :
                                    <>
                                        <Loader size={"3em"} mr={[0, 3]} mb={[2, 0]}/>
                                        <Flex flexDirection="column" alignItems={["center", "flex-start"]}>
                                            <Text fontWeight={4}>Waiting for connection confirmation...</Text>
                                            <Text fontWeight={2}>This won’t cost you any Ether</Text>
                                        </Flex>
                                    </>
                            }
                        </Flex>
                    </Box>
                    {(address || this.state.isConnectionError) ?
                        <Flex
                            p={[3, 4]}
                            borderTop={1}
                            borderColor="near-white"
                            justifyContent="flex-end"
                            flexDirection={["column", "row"]}
                            alignItems="center"
                        >
                            <Button.Outline
                                variant= {address ? "success" : "danger"}
                                mr={[0, 3]}
                                mb={[2, 0]}
                                width={["100%", "auto"]}
                                onClick={() => this.setState({showConnectModal: false})}
                            >
                                {address ? "Let's go" : "Don't connect"}
                            </Button.Outline>

                            {address ? <></> : <Button width={["100%", "auto"]} onClick={this.mount}>Reconnect</Button>}
                        </Flex>
                        : <></>
                    }
                </Card>
            </Modal>
        )
    }

    static truncateAddress(str) {
        return str.slice(0, 10) + "..." + str.slice(-10)
    }

    render() {
        return (
            <div className={"metamask-container"}>
                {this.connectModal()}
                {
                    this.state.address ?
                        <LoggedInMMButton mb={2} mt={2} onClick={this.handleClick}>
                            {MetaMaskLoginButton.truncateAddress(this.state.address)}
                        </LoggedInMMButton>
                        :
                        this.state.loading ?
                            <Loader style={{marginRight: 130}}/> :
                            <LoginMMButton mb={2} mt={2} onClick={this.handleClick}>
                                {this.state.install ? "Install MetaMask" : "Connect with MetaMask"}
                            </LoginMMButton>
                }
            </div>
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
    {login, updateMetamask},
)(MetaMaskLoginButton)