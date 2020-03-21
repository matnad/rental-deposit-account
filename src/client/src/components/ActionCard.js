import React, {Component} from "react"
import {connect} from "react-redux"
import {Box, Button, Card, Field, Form, Input, Text} from "rimble-ui"
import PropTypes from 'prop-types'
import web3Utils from "web3-utils"

class ActionCard extends Component {

  constructor(props) {
    super(props)
    this.state = {
      inputValue: "",
      valid: false
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if(this.state.inputValue !== prevState.inputValue) {
      this.validateForm()
    }
  }

  validateForm() {
    // Perform advanced validation here
    let isValidAddress
    try {
      isValidAddress = web3Utils.checkAddressChecksum(this.state.inputValue)
    } catch (e) {
      // ignore
    }
    if (
      (this.props.inputType === "number" && this.state.inputValue > 0)
      || (this.props.inputType === "address" && isValidAddress)
    ) {
      this.setState({valid: true})
    } else {
      this.setState({valid: false})
    }
  }

  render() {
    const {
      recommended, disabled, title, properties, confirmations, descriptions, buttonText,
      buttonCallback, callbackArgs, inputLabel, inputType
    } = this.props

    let form = <Button.Outline
      mt={3}
      width={1}
      disabled={disabled}
      onClick={() => {
        buttonCallback(...callbackArgs)
      }}
    >
      {buttonText}
    </Button.Outline>

    const handleSubmit = (e) => {
      e.preventDefault()
      if(this.state.valid) {
        buttonCallback(this.state.inputValue, ...callbackArgs)
      }
    }

    const handleChange = (e) => {
      this.setState({inputValue: e.target.value })
      switch (inputType) {
        case "number":
          e.target.value > 0 ? validateInput(e) : invalidateInput(e)
          break
        case "address":
          try {
            web3Utils.toChecksumAddress(e.target.value)
            validateInput(e)
          } catch (err) {
            console.log("err", err)
            invalidateInput(e)
          }
          break
        default:
          invalidateInput(e)
      }
    }

    const validateInput = e => {
      e.target.parentNode.classList.add("was-validated")
    }

    const invalidateInput = e => {
      e.target.parentNode.classList.remove("was-validated")
    }

    if (inputLabel) {
      form =
        <Form onSubmit={handleSubmit} validated={false}>
          <Box width={inputType === "address" ? 1 : 1/2} mt={3} color={"near-black"}>
            <Field label={inputLabel} width={1} validated={this.state.valid}>
              <Input
                type="text"
                color="near-black"
                bg="silver"
                required // set required attribute to use brower's HTML5 input validation
                onChange={handleChange}
                value={this.state.inputValue}
                width={1}
              />
            </Field>
          </Box>
          <Button.Outline
            mt={1}
            width={1}
            disabled={disabled}
            type="submit"
          >
            {buttonText}
          </Button.Outline>
        </Form>
    }



    const color = recommended ? 'near-black' : 'gray'
    const description = Array.isArray(descriptions) && descriptions.length === 2 ?
      descriptions[recommended ? 0 : 1] : descriptions[0]

    return (
      <Card
        maxWidth={500}
        bg={recommended ? "silver" : "blacks.4"}
        p={3}
        borderRadius={10}
        mx="auto"
        my={4}
      >
        <Box textAlign="left">
          <Box borderBottom="1px solid" borderColor="moon-gray" mb={2}>
            <Text color={color} fontWeight="bold" fontSize="1.2em" mb={1}>{title}</Text>
          </Box>
          <Text color={color} fontWeight="bold" mb={1}>
            Required Confirmations: {confirmations}
            {confirmations === 1 ? ' (will execute immediately)' : null}
          </Text>
          {properties.map((prop, index) => {
            return <Text key={index} color={color} fontWeight="bold" mb={1}>{prop}</Text>
          })}
          <Text color={color}>{description}</Text>
          {form}
        </Box>
      </Card>
    )
  }
}

ActionCard.propTypes = {
  recommended: PropTypes.bool,
  disabled: PropTypes.bool,
  title: PropTypes.string.isRequired,
  properties: PropTypes.array,
  confirmations: PropTypes.number.isRequired,
  buttonText: PropTypes.string.isRequired,
  buttonCallback: PropTypes.func,
  callbackArgs: PropTypes.array,
  inputLabel: PropTypes.string,
  inputType: PropTypes.string,
}

const mapStateToProps = (state) => {
  return ({
    auth: state.auth,
    rda: state.rda,
    txn: state.txn
  })
}

export default connect(
  mapStateToProps,
  {},
)(ActionCard)