import React, {Component} from 'react'
import {Col, Row} from "react-bootstrap"
import {connect} from "react-redux"

class Home extends Component {

  render() {
    return (
      <Row>
        <Col>
          <h2>Rental Deposit Account</h2>
          {this.props.auth.address}
        </Col>
      </Row>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return ({
    auth: state.auth
  })
}

export default connect(
  mapStateToProps,
  {}
)(Home)