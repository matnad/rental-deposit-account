import React, {Component} from "react"
import {connect} from "react-redux"
import {Box, Button, Card, Flex, Icon, Loader, Text, Tooltip} from "rimble-ui"
import {confirmTransaction, executeTransaction, revokeConfirmation} from "../actions/transactionActions"
import PropTypes from 'prop-types'
import {truncateAddressTo, weiToFixed} from "../utils/string"
import {ConfirmationType} from "../utils/transactionProperties"
import web3Utils from "web3-utils"

class RequestCard extends Component {

  constructor(props) {
    super(props)
    this.state = {
      index: props.index,
      isConfirmed: this.isTxnConfirmed(this.props.rda.selected.transactions[props.index].confirmationStatus),
      confirmationStatus: this.props.rda.selected.transactions[props.index].confirmationStatus,
      verify: null,
      isLoadingVerify: false,
    }
    this.filePicker = React.createRef();
    this.handleSelect = this.handleSelect.bind(this)
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const propStatus = this.props.rda.selected.transactions[this.state.index].confirmationStatus
    const stateStatus = this.state.confirmationStatus

    if (stateStatus[0] !== propStatus[0] || stateStatus[1] !== propStatus[1] || stateStatus[2] !== propStatus[2]) {
      this.setState({
        confirmationStatus: propStatus,
        isConfirmed: this.isTxnConfirmed(propStatus)
      })
    }
    if (prevProps.index !== this.props.index) {
      this.setState({index: this.props.index})
    }
  }

  isTxnConfirmed(confirmationStatus) {
    const {account} = this.props.auth
    const rda = this.props.rda.selected
    let participantIndex = 0

    switch (account) {
      case rda.trustee:
        participantIndex++
      // falls through
      case rda.landlord:
        participantIndex++
      // falls through
      case rda.tenant:
        break
      default:
        participantIndex = -1
    }
    return confirmationStatus[participantIndex]
  }

  handleSelect() {
    this.filePicker.current.click()
  }

  compareHash(e, hash) {
    this.setState({isLoadingVerify: true})
    e.target.files[0].text()
      .then(text => {
        this.setState({
          verify: web3Utils.keccak256(text) === hash,
          isLoadingVerify: false
        })
      })
  }

  render() {
    const {index} = this.state
    const {owner, txnType, dest, value, executed, confirmationStatus, id, name, hash} = this.props.rda.selected.transactions[index]

    let intType
    try {
      intType = Number.parseInt(txnType)
      // intId = Number.parseInt(id)
    } catch (e) {
      console.log("Invalid type or id:", txnType, id)
      return null
    }

    const {isConfirmed} = this.state
    if (isConfirmed === null) return null

    const {web3} = this.props
    const {account} = this.props.auth
    const rda = this.props.rda.selected


    const nameUft8 = web3.utils.hexToUtf8(name)
    const remainingFee = new web3.utils.BN(rda.fee).sub(new web3.utils.BN(rda.feePaid))
    let availableDeposit = new web3.utils.BN(rda.dsrBalance)
      .sub(remainingFee)
    if (availableDeposit.lt(new web3.utils.BN(0))) {
      availableDeposit = new web3.utils.BN(0)
    }
    const maxDamagePayout = new web3.utils.BN(rda.deposit).sub(new web3.utils.BN(rda.damagesPaid))
    const totalDai = new web3.utils.BN(rda.dsrBalance).add(new web3.utils.BN(rda.daiBalance))


    const confirmations = [2, 2, 2, "Up to 3"]
    const titles = ["Return Deposit to Tenant", "Pay Landlord from Deposit", "Migrate RDA", nameUft8]
    const descriptions = [
      <Text>When executed, this action will return the deposit with all interest minus any
        remaining fees to the tenant. This will essentially close the deposit.</Text>,
      <Text>When executed, this action will transfer up to {weiToFixed(value, 2)} DAI to the
        account of the landlord. In total, no more than the initial deposit can be transferred this way.</Text>,
      <Text>When executed, this action will transfer <strong>all</strong> DAI to the target address.
        Only use this when your funds are at risk. The trustee must always confirm this action before
        it can be executed.</Text>,
      <Text>This document is not stored online. You should have received a copy via e-mail or a similar
      channel. Click the "Verify Document" button and check if the received document matches the associated one.
      If you are happy with the document, click "Sign" to put your signature on it. Signing a document is final!</Text>
    ]
    const properties = [
      [`DAI to be returned: ${weiToFixed(availableDeposit, 4)} DAI`],
      [`Initial Deposit (max payout): ${weiToFixed(maxDamagePayout, 2)} DAI`,
        `Total DAI on the RDA: ${weiToFixed(totalDai, 2)}`,
        `Requested payment in DAI: ${weiToFixed(value, 2)} DAI`],
      [`Destination address for migration: ${dest}`,
        `DAI that will be migrated: ~ ${weiToFixed(totalDai, 4)} DAI`],
      [<Tooltip message={hash}>
        <Text fontWeight="bold">
          Hash: {truncateAddressTo(hash, 30)}
        </Text>
      </Tooltip>
      ]
    ]

    const confirmedBy = []
    if (confirmationStatus[0]) confirmedBy.push("Tenant")
    if (confirmationStatus[1]) confirmedBy.push("Landlord")
    if (confirmationStatus[2]) confirmedBy.push("Trustee")
    let canExecute = false
    if (txnType === ConfirmationType.MIGRATE) {
      canExecute = confirmationStatus[2] && confirmedBy.length >= 2
    } else {
      canExecute = confirmedBy.length >= 2
    }

    let startedBy = owner
    if (owner === rda.tenant) startedBy = "Tenant"
    else if (owner === rda.landlord) startedBy = "Landlord"
    else if (owner === rda.trustee) startedBy = "Trustee"
    let currentProperties
    if(txnType === ConfirmationType.DOCUMENT) {
      currentProperties = [
        "Added by: " + startedBy,
        confirmedBy.length > 0 ? "Signed by: " + confirmedBy.join(", ") : "Signed by: No one",
      ]

    } else {
      currentProperties = [
        "Initiated by: " + startedBy,
        "Required Confirmations: " + confirmations[intType],
        confirmedBy.length > 0 ? "Confirmed by: " + confirmedBy.join(", ") : "Confirmed by: No one",
      ]
    }
    currentProperties.push(...properties[intType])

    const color = executed ? 'gray' : 'near-black'


    return (
      <Card
        maxWidth={500}
        bg={executed ? "blacks.4" : "silver"}
        p={3}
        borderRadius={10}
        mx="auto"
        my={4}
      >
        <Box textAlign="left">
          <Box borderBottom="1px solid" borderColor="moon-gray" mb={2}>
            <Text color={color} fontWeight="bold" fontSize="1.2em" mb={1}>{titles[intType]}</Text>
          </Box>
          {currentProperties.map((property, index) => {
            return <Text key={index} color={color} fontWeight="bold" mb={1}>{property}</Text>
          })}
          <Text color={color}>{descriptions[intType]}</Text>
          {txnType === ConfirmationType.DOCUMENT ?
            <Flex >
              <Button.Outline
                mt={3}
                width={1}
                mx={2}
                disabled={isConfirmed}
                onClick={() => {
                  this.props.confirmTransaction(id, rda.address, account)
                }}
              >
                {isConfirmed ? "Signed" : "Sign"}
              </Button.Outline>
              <Button.Outline
                mt={3}
                width={1}
                mx={2}
                onClick={this.handleSelect}
              >
                {this.state.isLoadingVerify ? <Loader mx="auto"/> :
                this.state.verify === null ? "Verify Document" :
                this.state.verify === true ? <Icon name="CheckCircle" color="darkgreen" size="2em"/> :
                  <Icon name="Warning" color="danger" size="2em"/>}
              </Button.Outline>
              <input
                ref={this.filePicker}
                type="file"
                style={{display: "none"}}
                onChange={(e) => this.compareHash(e, hash)}
              />
            </Flex>
            :
            <>
              <Button.Outline
                mt={3}
                width={1}
                mx={2}
                disabled={!canExecute || executed}
                onClick={() => {
                  this.props.executeTransaction(id, rda.address, account)
                }}
              >
                {executed ?
                  "Already Executed" :
                  "Execute Action" + (!canExecute ?
                    txnType === ConfirmationType.MIGRATE && confirmedBy.length === 2 ?
                      ` (Trustee must confirm)` :
                      ` (${2 - confirmedBy.length} more confirmation needed)` :
                    ''
                  )
                }
              </Button.Outline>
              <Flex>
                <Button.Outline
                  mt={3}
                  width={1}
                  mx={2}
                  disabled={isConfirmed || executed}
                  onClick={() => {
                    this.props.confirmTransaction(id, rda.address, account)
                  }}
                >
                  Confirm
                </Button.Outline>
                <Button.Outline
                  mt={3}
                  width={1}
                  mx={2}
                  disabled={!isConfirmed || executed}
                  onClick={() => {
                    this.props.revokeConfirmation(id, rda.address, account)
                  }}
                >
                  Revoke Confirmation
                </Button.Outline>
              </Flex>
            </>
          }
        </Box>
      </Card>
    )
  }
}

RequestCard.propTypes = {
  web3: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired
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
  {confirmTransaction, revokeConfirmation, executeTransaction},
)(RequestCard)