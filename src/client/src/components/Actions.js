import React, {Component} from "react"
import {connect} from "react-redux"
import {Box, Card, Heading, Text} from "rimble-ui"
import PageLoader from "./PageLoader"
import {Redirect} from "react-router-dom"
import {getEthereum} from "../utils/getEthereum"
import Web3 from "web3"
import {fundContract, startRda, withdrawInterest, withdrawTrusteeFee} from "../actions/transactionActions"
import ActionCard from "./ActionCard"
import {selectRda} from "../actions/rdaActions"

class Actions extends Component {

  constructor(props) {
    super(props)
    this.state = {
      web3: null
    }
  }

  componentDidMount = async () => {
    try {
      const ethereum = await getEthereum()
      this.setState({
        web3: new Web3(ethereum)
      })
    } catch (e) {
      console.log(e)
      // no provider
    }
    if (this.props.rda.selected.address) {
      this.props.selectRda(this.props.rda.selected.address)
    }
  }

  render() {
    const {isLoading, account, daiBalance} = this.props.auth
    const rda = this.props.rda.selected
    const {web3} = this.state
    if (!web3) return null
    if (isLoading) {
      return <PageLoader/>
    } else if (!rda || !rda.address) {
      return <Redirect to={"/home"}/>
    }

    const isTenant = rda.tenant === account
    // const isLandlord = rda.landlord === account
    const isTrustee = rda.trustee === account
    // const isInvolved = isTenant || isLandlord || isTrustee

    const remainingFee = new web3.utils.BN(rda.fee).sub(new web3.utils.BN(rda.feePaid))
    const availableInterest = new web3.utils.BN(rda.dsrBalance)
      .sub(new web3.utils.BN(rda.deposit))
      .sub(remainingFee)

    let availableFee = new web3.utils.BN(rda.dsrBalance)
      .sub(new web3.utils.BN(rda.deposit))
    if (availableFee.gt(new web3.utils.BN(remainingFee))) {
      availableFee = new web3.utils.BN(remainingFee)
    }

    return (
      <Card
        width={[1, 1, 3 / 4]}
        mx={"auto"}
        bg={"dark-gray"}
        px={[1, 1, 3]}
        border={"none"}
      >
        <Box borderRadius={10} bg="blacks.4">
          <Box py={[1, 1, 3]} textAlign="center">
            <Heading>Rental Deposit Account</Heading>
            <Text
              fontWeight="bold"
              my={[1, 1, 2]}
              mx="auto"
              width={[9 / 10, 9 / 10, 3 / 4]}
              address={rda.address}
            >{rda.address}</Text>
          </Box>
          <Box mb={4} textAlign="center">
            <Box mx="auto" width={9 / 10}>
              <Text>
                Here you can confirm and initiate different actions.
                Most actions require the confirmation of another participant before they can be executed.
                For more details, please read the FAQ.
              </Text>
            </Box>
          </Box>
          <ActionCard
            title="Withdraw Interest"
            recommended={isTenant}
            disabled={availableInterest.lte(new web3.utils.BN(0))}
            properties={[
              `Currently available interest: ${web3.utils.fromWei(availableInterest, "ether").toString()} DAI`
            ]}
            descriptions={[
              "This action withdraws all available interest to the account of the tenant " +
              "(you are currently connected as the tenant). " +
              "The remaining trustee fee and the full deposit will be withheld by the contract. " +
              "You can only call this action if the available interest is positive.",
              "This action withdraws all available interest to the account of the tenant. " +
              "The remaining trustee fee and the full deposit will be withheld by the contract. " +
              "Under normal circumstances, only the tenant should call this action."
            ]}
            confirmations={1}
            buttonText="Withdraw Interest"
            buttonCallback={this.props.withdrawInterest}
            callbackArgs={[rda.address, this.props.auth.account]}
          />

          <ActionCard
            title="Transfer Deposit to RDA"
            recommended={isTenant}
            disabled={new web3.utils.BN(rda.deposit).gt(new web3.utils.BN(0))}
            properties={[
              `Current DAI balance of the RDA: ${web3.utils.fromWei(rda.daiBalance, "ether").toString()} DAI`,
              `DAI balance of connected account: ${web3.utils.fromWei(daiBalance, "ether").toString()} DAI`,
            ]}
            descriptions={[
              "This action will transfer DAI from your account to the RDA. It is only available if " +
              "the RDA has not been started.",
              "This action will transfer DAI from your account to the RDA. It is only available if " +
              "the RDA has not been started." +
              "Under normal circumstances, only the tenant should call this action."
            ]}
            confirmations={1}
            inputLabel="Amount of DAI to transfer"
            inputType="number"
            buttonText="Transfer DAI to RDA"
            buttonCallback={this.props.fundContract}
            callbackArgs={[rda.address, this.props.auth.account]}
          />

          <ActionCard
            title="Start and Lock the RDA"
            recommended={isTenant}
            disabled={
              new web3.utils.BN(rda.deposit).gt(new web3.utils.BN(0)) ||
              new web3.utils.BN(rda.daiBalance).lte(new web3.utils.BN(0)) ||
              !isTenant
            }
            properties={[
              `Current DAI balance of the RDA: ${web3.utils.fromWei(rda.daiBalance, "ether").toString()} DAI`,
            ]}
            descriptions={[
              <>
                <Text>
                  This action will start the Rental Deposit Account and lock the current DAI balance
                  of the contract as the Rental Deposit.<br/>
                  You can only call this action if the DAI balance is positive and the RDA has not been started yet.
                </Text>
                <Text fontWeight="bold">
                  Warning: This action is irreversible. The Deposit Amount is fixed and can not be changed.
                </Text>
              </>
              ,
              <Text>
                This action will start the Rental Deposit Account and lock the current DAI balance
                of the contract as the Rental Deposit.<br/>
                Only the Tenant can use this action.
              </Text>
            ]}
            confirmations={1}
            buttonText="Start the RDA"
            buttonCallback={this.props.startRda}
            callbackArgs={[rda.address, this.props.auth.account]}
          />

          <ActionCard
            title="Withdraw Trustee Fee"
            recommended={isTrustee}
            disabled={availableFee.lte(new web3.utils.BN(0))}
            properties={[
              `Remaining Fee: ${web3.utils.fromWei(remainingFee, "ether")} DAI`,
              `Available Fee: ${web3.utils.fromWei(availableFee, "ether")} DAI`
            ]}
            descriptions={[
              <Text>This action withdraws as much as possible of the trustee Fee to the account of the trustee
                (you are currently connected as the trustee).
                The full deposit will be withheld by the contract; only accrued interest will be withdrawn.</Text>,
              <Text>This action withdraws as much as possible of the trustee Fee to the account of the trustee.
                The full deposit will be withheld by the contract; only accrued interest will be withdrawn.
                Under normal circumstances, only the trustee should call this action.</Text>
            ]}
            confirmations={1}
            buttonText="Withdraw Trustee Fee"
            buttonCallback={this.props.withdrawTrusteeFee}
            callbackArgs={[rda.address, this.props.auth.account]}
          />

          <Box height="40px"/>
        </Box>
      </Card>
    )
  }
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
  {withdrawInterest, withdrawTrusteeFee, fundContract, selectRda, startRda},
)(Actions)