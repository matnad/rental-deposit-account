import React, {Component} from "react"
import {ToastMessage} from "rimble-ui"

import TopNav from "./components/TopNav"
import Home from "./components/Home"
import {Container} from "react-bootstrap"
import {Route, Switch} from "react-router-dom"
import CreateRDA from "./components/CreateRda"
import PageLoader from "./components/PageLoader"
import Wrapper from "./components/Wrapper"
import RdaDetails from "./components/RdaDetails"
import RdaActions from "./components/Actions"
import Requests from "./components/Requests"
import Faq from "./components/Faq"
import Documents from "./components/Documents"
import DocumentAdd from "./components/DocumentAdd"

class App extends Component {

  render() {
    return (
      <>
        <Route path={"/"} render={routeProps => (
          <TopNav routeProps={routeProps}/>
        )}
        />
        <div style={{height: 100}}/>
        <ToastMessage.Provider delay={5000} ref={node => (window.toastProvider = node)}/>
        <Container>
          <Wrapper>
            <Switch>
              <Route path="/create" component={CreateRDA}/>
              <Route path="/details" component={RdaDetails}/>
              <Route path="/actions" component={RdaActions}/>
              <Route path="/requests" component={Requests}/>
              <Route path="/documents/add" component={DocumentAdd}/>
              <Route path="/documents" component={Documents}/>
              <Route path="/faq" component={Faq}/>
              <Route path="/loader" component={PageLoader}/>
              <Route path="/" component={Home}/>
            </Switch>
          </Wrapper>
        </Container>
      </>
    )
  }
}

export default App
