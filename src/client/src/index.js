import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import * as serviceWorker from './serviceWorker'
import {BrowserRouter} from "react-router-dom"
import {Provider} from "react-redux"
import {store} from "./store"
import ToastWrapper from "./components/ToastWrapper"

import './assets/css/rda.css'
import './assets/css/bootstrap4-charming.css'

ReactDOM.render(
  <BrowserRouter>
    <Provider store={store}>
        <ToastWrapper>
          <App/>
        </ToastWrapper>
    </Provider>
  </BrowserRouter>,
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
