import React from "react"
import ReactDOM from "react-dom"
import "./index.css"
import App from "./App"
import * as serviceWorker from "./serviceWorker"
import {BrowserRouter} from "react-router-dom"
import {Provider} from "react-redux"
import {store} from "./store"
import {BaseStyles, ThemeProvider, theme} from "rimble-ui"

import "./assets/css/bootstrap4-charming.css"

const customTheme = {
    ...theme
}
customTheme.colors.text = "white"
customTheme.colors.background = '#282828 '
customTheme.colors.primary = "#6f54d7"
customTheme.colors['primary-light'] = "#7d68d7"

ReactDOM.render(
    <BrowserRouter>
        <Provider store={store}>
            <ThemeProvider theme={customTheme}>
                <BaseStyles>
                    <App/>
                </BaseStyles>
            </ThemeProvider>
        </Provider>
    </BrowserRouter>,
    document.getElementById("root"),
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
