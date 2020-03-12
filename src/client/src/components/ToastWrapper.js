import React, {Component} from 'react'
import {Toast} from "react-bootstrap"

import PropTypes from "prop-types"
import {connect} from "react-redux"
import {pushToast, removeToast, toggleToast} from "../actions/toastActions"

class ToastWrapper extends Component {

  state = {
    path: this.props.path
  }

  constructor(props) {
    super(props)
    this.fadeToastOut = this.fadeToastOut.bind(this)
  }

  componentDidMount() {
    this.interval = setInterval(() => this.update(), 5000);
    // this.props.pushToast("test", "test")
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  update() {
    // Update timer on toasts if there are any
    if (this.props.toasts.length > 0) {
      this.forceUpdate()
    }
  }

  inlineFadeToastOut = id => e => {
    this.fadeToastOut(id)
  }

  fadeToastOut(id) {
    const {toggleToast, removeToast} = this.props
    // fade out animation
    toggleToast(id)
    // remove 0.6 secs later
    setTimeout(function () {
      removeToast(id)
    }, 450);
  }

  renderToasts() {
    return this.props.toasts.map((toast, index) => {
      const timeDiff = Math.round((Date.now() - toast.time) / 1000)
      let timeStr = ""
      if (timeDiff < 3) {
        timeStr = "just now"
      } else {
        timeStr = `${timeDiff} seconds ago`
      }
      if (timeDiff >= 20 && toast.show) {
        this.fadeToastOut(toast.time)
      }
      return (<Toast
        className="toastWindow"
        show={toast.show}
        onClose={this.inlineFadeToastOut(toast.time)}
        key={index}>
        <Toast.Header>
          {/*<img src={logo} className="rounded mr-2" alt=""/>*/}
          <strong className="mr-auto">{toast.title}</strong>
          <small>{timeStr}</small>
        </Toast.Header>
        <Toast.Body>{toast.msg}</Toast.Body>
      </Toast>)

    })
  }

  render() {
    return (
      <>
        <div
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'relative'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 10
            }}
          >
            {this.renderToasts()}
          </div>
        </div>
        {this.props.children}
      </>
    )
  }

}

ToastWrapper.propTypes = {
  toasts: PropTypes.array.isRequired
}

const mapStateToProps = state => ({
  toasts: state.toasts
});

export default connect(
  mapStateToProps,
  {removeToast, pushToast, toggleToast}
)(ToastWrapper);
