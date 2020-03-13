import React, {Component} from "react"
import {connect} from "react-redux"
import {MetaMaskButton, Modal, Box, Flex, Text, Loader, Button, Link, Icon, Image, Card, Heading} from "rimble-ui"
import styled from "styled-components"
import {loaded, updateAccount, updateMetamask, updateNetwork} from "../../../actions/authActions"
import {getEthereum} from "../../../utils/getEthereum"
import {desiredNetworks, networkNames} from "../../../utils/settings"

import metamaskSvg from "../../../assets/images/MetaMaskIcon.svg"
import {truncateAddress} from "../../../utils/string"

let detect = require("detect-browser").detect

let isMobile

const LoginMMButton = styled(MetaMaskButton)`
  & {
    height: 37px;
  }
`

const LoggedInMMButton = styled(LoginMMButton)`
  & {
    padding: 15px;
    border-radius: 150px;
    background-color: #1e1e1e;
  }
  &:hover {
    background-color: #1e1e1e;
  }
  
`

class MetaMaskLoginButton extends Component {
  constructor(props, context) {
    super(props, context)

    this.handleClick = this.handleClick.bind(this)
    this.mount = this.mount.bind(this)
    this.init = this.init.bind(this)

    this.handleChainChanged = this.handleChainChanged.bind(this)
    this.handleAccountsChanged = this.handleAccountsChanged.bind(this)

    this.state = {
      isLoading: true,
      isMetaMask: false,
      account: null,
      chainId: null,
      showConnectModal: false,
      isConnectionError: false
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevState.isMetaMask !== this.state.isMetaMask) {
      this.props.updateMetamask(this.state.isMetaMask)
    }

    if (prevState.isLoading !== this.state.isLoading) {
      this.props.loaded()
    }

    if (prevState.account !== this.state.account) {
      this.props.updateAccount(this.state.account)
      if (prevState.account != null && this.state.account != null)
        window.toastProvider.addMessage(
          `Account switched to`,
          {secondaryMessage: MetaMaskLoginButton.truncateAddress(this.state.account), variant: "success"},
        )
    }

    if (prevState.chainId !== this.state.chainId) {
      this.props.updateNetwork(this.state.chainId)
      if (!desiredNetworks.includes(this.state.chainId)) {
        window.toastProvider.addMessage(
          `${networkNames[this.state.chainId]} not supported`,
          {secondaryMessage: "Use Ethereum Main Net or Custom RPC", variant: "failure"},
        )
      } else if (prevState.chainId != null) {
        window.toastProvider.addMessage(
          `Network switched to ${networkNames[this.state.chainId]}`,
          {variant: "success"},
        )
      }
    }
  }

  handleChainChanged = (chainId) => this.setState({chainId})

  handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      console.log('Please connect to MetaMask.')
    } else if (accounts[0] !== null) {
      this.setState({
        account: accounts[0]
      })
    }
  }

  componentWillMount = async () => {
    const ethereum = await getEthereum()
    ethereum.autoRefreshOnNetworkChange = false

    this.handleChainChanged(ethereum.networkVersion) // will be async send
    ethereum.on('networkChanged', this.handleChainChanged) // Will be chainChanged

    this.handleAccountsChanged([ethereum.selectedAddress]) // this will change a lot
    ethereum.on('accountsChanged', this.handleAccountsChanged)

    this.setState({
      isMetaMask: ethereum.isMetaMask,
      isLoading: false
    })
  }

  handleClick() {
    if (this.state.account) {
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
    if (this.state.isMetaMask) {
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
    try {
      this.setState({isConnectionError: false})
      const ethereum = await getEthereum()
      this.setState({showConnectModal: true})
      const accounts = await ethereum.enable()
      this.handleAccountsChanged(accounts)
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
    const {account} = this.state
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
              {account ?
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
                      <Text fontWeight={2}>Without connecting your Account, you will not be able to use this website.</Text>
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
          {(account || this.state.isConnectionError) ?
            <Flex
              p={[3, 4]}
              borderTop={1}
              borderColor="near-white"
              justifyContent="flex-end"
              flexDirection={["column", "row"]}
              alignItems="center"
            >
              <Button.Outline
                variant={account ? "success" : "danger"}
                mr={[0, 3]}
                mb={[2, 0]}
                width={["100%", "auto"]}
                onClick={() => this.setState({showConnectModal: false})}
              >
                {account ? "Let's go" : "Don't connect"}
              </Button.Outline>

              {account ? <></> : <Button width={["100%", "auto"]} onClick={this.mount}>Reconnect</Button>}
            </Flex>
            : <></>
          }
        </Card>
      </Modal>
    )
  }



  render() {
    const {account, isLoading, isMetaMask} = this.state
    return (
      <div className={"metamask-container"}>
        {this.connectModal()}
        {
          account ?
              <LoggedInMMButton mb={2} mt={2} onClick={this.handleClick}>
                  {truncateAddress(account)}
              </LoggedInMMButton>
              :
              isLoading ?
                  <Loader size={"1.5em"} style={{marginRight: 130}}/> :
                  <LoginMMButton mb={2} mt={2} onClick={this.handleClick}>
                      {isMetaMask ? "Connect with MetaMask" : "Install MetaMask"}
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
  {updateAccount, updateMetamask, updateNetwork, loaded},
)(MetaMaskLoginButton)