import React, {useState} from "react"
import {Box, Button, Field, Flex, Form, Heading, Input, Text} from "rimble-ui"
import {connect} from "react-redux"
import {createRdaTxn} from "../actions/transactionActions"


function RdaForm(props) {
  const [formValidated] = useState(false)
  const [validated, setValidated] = useState(false)
  const [tenantValue, setTenantValue] = useState("0x16Fb96a5fa0427Af0C8F7cF1eB4870231c8154B6")
  const [landlordValue, setLandlordValue] = useState("0x81431b69B1e0E334d4161A13C2955e0f3599381e")
  const [trusteeValue, setTrusteeValue] = useState("0xDa1495EBD7573D8E7f860862BaA3aBecebfa02E0")
  const [trusteeFeeValue, setTrusteeFeeValue] = useState("100")

  const web3 = props.web3

  const handleTenant = e => {
    setTenantValue(e.target.value)
    try {
      setTenantValue(web3.utils.toChecksumAddress(e.target.value))
      validateInput(e)
    } catch (err) {
      invalidateInput(e)
    }
  }

  const handleLandlord = e => {
    setLandlordValue(e.target.value)
    try {
      setLandlordValue(web3.utils.toChecksumAddress(e.target.value))
      validateInput(e)
    } catch (err) {
      invalidateInput(e)
    }
  }

  const handleTrustee = e => {
    setTrusteeValue(e.target.value)
    try {
      setTrusteeValue(web3.utils.toChecksumAddress(e.target.value))
      validateInput(e)
    } catch (err) {
      invalidateInput(e)
    }
  }

  const handleTrusteeFee = e => {
    setTrusteeFeeValue(e.target.value)
    if (e.target.value >= 0) {
      validateInput(e)
    } else {
      invalidateInput(e)
    }
  }

  const validateInput = e => {
    e.target.parentNode.classList.add("was-validated")
  }

  const invalidateInput = e => {
    e.target.parentNode.classList.remove("was-validated")
  }

  const validateForm = () => {
    // Perform advanced validation here
    if (
      web3.utils.isAddress(tenantValue) &&
      web3.utils.isAddress(landlordValue) &&
      web3.utils.isAddress(trusteeValue) &&
      trusteeFeeValue > 0 &&
      props.auth.account != null &&
      tenantValue !== landlordValue &&
      tenantValue !== trusteeValue &&
      landlordValue !== trusteeValue
    ) {
      setValidated(true)
    } else {
      setValidated(false)
    }
  }

  React.useEffect(() => {
    validateForm()
  })

  const handleSubmit = e => {
    e.preventDefault()
    if (props.auth.account != null) {
      const weiFee = web3.utils.toWei(trusteeFeeValue.toString(), "ether")
      props.createRdaTxn(tenantValue, landlordValue, trusteeValue, weiFee.toString(), props.auth.account)
    }
  }

  const {account} = props.auth


  return (
    <Box p={2}>
      <Box>
        <Form onSubmit={handleSubmit} validated={formValidated}>
          <Box width={[1, 1, 1]} px={3} mb={3}>
            <Heading>Create a new Rental Deposit Account</Heading>
          </Box>
          <Box width={[1, 1, 1]} px={3} mb={2}>
            {account ?
              <>
                <Text fontSize={".9em"}>Enter the Ethereum addresses of the three participants and the fee for the
                  trustee. <br/>
                  You can only proceed if all three addresses are different and valid Ethereum accounts.</Text>
                {
                  (tenantValue === landlordValue || tenantValue === trusteeValue || landlordValue === trusteeValue) ?
                    <Text color="warning">All participants must have unique addresses!</Text> : null
                }
              </>
              :
              <Text fontSize={"1em"} fontWeight="bold">You must be logged in and connected with MetaMask to
                continue!</Text>
            }
          </Box>
          <hr/>
          <Flex mt={2} mb={3} flexWrap={"wrap"}>
            <Box width={[1, 1, 1 / 2]} px={3}>
              <Field label="Tenant Address" validated={validated} width={1}>
                <Input
                  type="text"
                  color="near-black"
                  bg="silver"
                  required // set required attribute to use brower's HTML5 input validation
                  onChange={handleTenant}
                  value={tenantValue}
                  width={1}
                  placeholder="e.g. 0xAc03BB73b6a9e108530AFf4Df..."
                />
              </Field>
            </Box>
            <Box width={[1, 1, 1 / 2]} px={3}>
              <Field label="Landlord Address" validated={validated} width={1}>
                <Input
                  type="text"
                  color="near-black"
                  bg="silver"
                  required // set required attribute to use brower's HTML5 input validation
                  onChange={handleLandlord}
                  value={landlordValue}
                  width={1}
                  placeholder="e.g. 0xAc03BB73b6a9e108530AFf4Df..."
                />
              </Field>
            </Box>
          </Flex>
          <Flex flexWrap={"wrap"} mb={3}>
            <Box width={[1, 1, 1 / 2]} px={3}>
              <Field label="Trustee Address" validated={validated} width={1}>
                <Input
                  type="text"
                  color="near-black"
                  bg="silver"
                  required // set required attribute to use brower's HTML5 input validation
                  onChange={handleTrustee}
                  value={trusteeValue}
                  width={1}
                  placeholder="e.g. 0xAc03BB73b6a9e108530AFf4Df..."
                />
              </Field>
            </Box>
            <Box width={[1, 1, 1 / 2]} px={3}>
              <Field label="Trustee Fee in DAI" validated={validated} width={1}>
                <Input
                  type="number"
                  color="near-black"
                  bg="silver"
                  required // set required attribute to use brower's HTML5 input validation
                  onChange={handleTrusteeFee}
                  value={trusteeFeeValue}
                  width={1}
                  placeholder="100"
                />
              </Field>
            </Box>
          </Flex>
          <Box>
            {/* Use the validated state to update UI */}
            <Button type="submit" disabled={!validated}>
              Next: Review and Confirm
            </Button>
          </Box>
        </Form>
      </Box>
      {/*<Card my={4} bg="near-black">*/}
      {/*  <Heading as={"h4"}>Form values</Heading>*/}
      {/*  <Text>Valid form: {validated.toString()}</Text>*/}
      {/*  <Text>Tenant value: {tenantValue}</Text>*/}
      {/*  <Text>Landlord value: {landlordValue}</Text>*/}
      {/*  <Checkbox*/}
      {/*    label="Toggle Form Validation"*/}
      {/*    value={formValidated}*/}
      {/*    onChange={e => setFormValidated(!formValidated)}*/}
      {/*  />*/}
      {/*  <Text>Form validated: {formValidated.toString()}</Text>*/}
      {/*</Card>*/}
    </Box>
  )
}

const mapStateToProps = (state, ownProps) => {
  return ({
    auth: state.auth
  })
}

export default connect(
  mapStateToProps,
  {createRdaTxn},
)(RdaForm)