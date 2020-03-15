import React, {Component} from "react"
// import SavingWrapper from "./contracts/TestWrapperSavingDai.json"
// import getWeb3 from "./getWeb3"
import {ToastMessage} from "rimble-ui"

import "./App.css"
import TopNav from "./components/TopNav"
import Home from "./components/Home"
import {Container} from "react-bootstrap"
import {Route, Switch} from "react-router-dom"
import CreateRDA from "./components/CreateRda"
import PageLoader from "./components/PageLoader"
import Wrapper from "./components/Wrapper"
import RdaDetails from "./components/RdaDetails"

class App extends Component {
  state = {storageValue: 0, web3: null, accounts: null, contract: null}

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      // const web3 = await getWeb3();
      // console.log(web3)
      // // Use web3 to get the user's accounts.
      // const accounts = await web3.eth.getAccounts();
      // console.log(accounts)

      // Get the contract instance.
      // const networkId = await web3.eth.net.getId();
      // const deployedNetwork = SavingWrapper.networks[networkId];
      // const instance = new web3.eth.Contract(
      //   SimpleStorageContract.abi,
      //   deployedNetwork && deployedNetwork.address,
      // );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      // this.setState({ web3, accounts });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      )
      console.error(error)
    }
  }

  render() {
    return (
      <>
        <Route path={"/"} render={routeProps => (
          <TopNav routeProps={routeProps}/>
        )}
        />
        <div style={{height: 100}}/>
        <ToastMessage.Provider delay={20000} ref={node => (window.toastProvider = node)}/>
        <Wrapper>
          <Container>
            <Switch>
              <Route path="/create" component={CreateRDA}/>
              <Route path="/details" component={RdaDetails}/>
              <Route path="/loader" component={PageLoader}/>
              <Route path="/" component={Home}/>
            </Switch>
          </Container>
        </Wrapper>
      </>
    )
  }
}

export default App
