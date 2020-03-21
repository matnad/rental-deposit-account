import React, {Component} from "react"
import {connect} from "react-redux"
import {Box, Card, Heading, Text} from "rimble-ui"
import PageLoader from "./PageLoader"
import {Redirect} from "react-router-dom"
import {getEthereum} from "../utils/getEthereum"
import Web3 from "web3"
import {
  fundContract, migrate, payDamages,
  returnDeposit,
  startRda,
  withdrawInterest,
  withdrawTrusteeFee
} from "../actions/transactionActions"
import ActionCard from "./ActionCard"
import {selectRda} from "../actions/rdaActions"
import {weiToFixed} from "../utils/string"

let BN0

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

  sortActions() {
    let {account, daiBalance} = this.props.auth
    const rda = this.props.rda.selected
    const {web3} = this.state

    BN0 = new web3.utils.BN(0)
    const isTenant = rda.tenant === account
    const isLandlord = rda.landlord === account
    const isTrustee = rda.trustee === account
    // const isInvolved = isTenant || isLandlord || isTrustee

    const dsrBalance = new web3.utils.BN(rda.dsrBalance)
    const rdaDeposit = new web3.utils.BN(rda.deposit)

    const remainingFee = new web3.utils.BN(rda.fee).sub(new web3.utils.BN(rda.feePaid))
    let availableInterest = dsrBalance
      .sub(rdaDeposit)
      .sub(remainingFee)
    if (availableInterest.lt(BN0)) availableInterest = BN0

    let availableFee = dsrBalance.sub(rdaDeposit)
    if (availableFee.gt(remainingFee)) {
      availableFee = remainingFee
    }

    let availableDeposit = dsrBalance
      .sub(remainingFee)
    if (availableDeposit.lt(BN0)) availableDeposit = BN0

    const maxDamagePayout = rdaDeposit.sub(new web3.utils.BN(rda.damagesPaid))
    const totalDai = dsrBalance.add(new web3.utils.BN(rda.daiBalance))

    const isActive = rdaDeposit.gt(BN0)

    const isRecommended = {
      withdrawInterest: isTenant && isActive,
      fundContract: isTenant && !isActive,
      start: isTenant && new web3.utils.BN(rda.daiBalance).gt(BN0),
      withdrawTrusteeFee: isTrustee && availableFee.gt(BN0),
      returnDeposit: isTenant && totalDai.gt(BN0),
      payDamages: isLandlord && isActive,
      migrate: isTrustee,
    }

    const isRecommendedActions = {
      true: [],
      false: [],
    }

    isRecommendedActions[isRecommended.withdrawInterest].push(
      <ActionCard
        key="withdrawInterest"
        title="Withdraw Interest"
        recommended={isRecommended.withdrawInterest}
        disabled={availableInterest.lte(BN0) || !isActive}
        properties={[
          `Currently available interest: ${weiToFixed(availableInterest, 4)} DAI`
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
    )

    isRecommendedActions[isRecommended.start].push(
      <ActionCard
        key="start"
        title="Start and Lock the RDA"
        recommended={isRecommended.start}
        disabled={
          rdaDeposit.gt(BN0) ||
          new web3.utils.BN(rda.daiBalance).lte(BN0) ||
          !isTenant
        }
        properties={[
          `Current DAI balance of the RDA: ${weiToFixed(rda.daiBalance, 4)} DAI`,
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
    )

    // if (daiBalance == null) daiBalance = BN0
    isRecommendedActions[isRecommended.fundContract].push(
      <ActionCard
        key="fundContract"
        title="Transfer Deposit to RDA"
        recommended={isRecommended.fundContract}
        disabled={rdaDeposit.gt(BN0)}
        properties={[
          `Current DAI balance of the RDA: ${weiToFixed(rda.daiBalance, 4)} DAI`,
          `DAI balance of connected account: ${weiToFixed(daiBalance, 4)} DAI`,
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
    )

    isRecommendedActions[isRecommended.withdrawTrusteeFee].push(
      <ActionCard
        key="withdrawTrusteeFee"
        title="Withdraw Trustee Fee"
        recommended={isRecommended.withdrawTrusteeFee}
        disabled={availableFee.lte(BN0) || !isActive}
        properties={[
          `Remaining Fee: ${weiToFixed(remainingFee, 2)} DAI`,
          `Available Fee: ${weiToFixed(availableFee, 4)} DAI`
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
    )

    isRecommendedActions[isRecommended.returnDeposit].push(
      <ActionCard
        key="returnDeposit"
        title="Request to return Deposit to Tenant"
        recommended={isRecommended.returnDeposit}
        disabled={availableDeposit.lte(BN0) || !isActive}
        properties={[
          `Total available funds on RDA: ${weiToFixed(availableDeposit, 4)} DAI`
        ]}
        descriptions={[
          <Text>This will create a request to return the full deposit to the tenant.
            At least one other participant will have to confirm this action before it can be executed.</Text>
        ]}
        confirmations={2}
        buttonText="Request to Return the Deposit"
        buttonCallback={this.props.returnDeposit}
        callbackArgs={[rda.address, this.props.auth.account]}
      />
    )

    isRecommendedActions[isRecommended.payDamages].push(
      <ActionCard
        key="payDamages"
        title="Request to pay the Landlord from the Deposit"
        recommended={isRecommended.payDamages}
        disabled={maxDamagePayout.lte(BN0) || !isActive}
        properties={[
          `Initial Deposit (max payout): ${weiToFixed(maxDamagePayout, 2)} DAI`,
          `Total DAI on the RDA: ${weiToFixed(totalDai, 2)}`,
        ]}
        descriptions={[
          <Text>This will create a pending transaction to transfer DAI from the deposit to the landlord's account.
            At least one other participant will have to confirm this action before it can be executed.</Text>
        ]}
        confirmations={2}
        buttonText="Request to pay Landlord"
        inputLabel="Amount of DAI to pay"
        inputType="number"
        buttonCallback={this.props.payDamages}
        callbackArgs={[rda.address, this.props.auth.account]}
      />
    )

    isRecommendedActions[isRecommended.migrate].push(
      <ActionCard
        key="migrate"
        title="Request to migrate the RDA to a new address"
        recommended={isRecommended.migrate}
        disabled={false}
        properties={[
          `Total DAI on the RDA: ${weiToFixed(totalDai, 4)} DAI`
        ]}
        descriptions={[
          <Text>This will create a pending transaction to transfer <strong>ALL</strong> DAI from
            the RDA to another account. At least one other participant including the trustee
            will have to confirm this action before it can be executed.</Text>
        ]}
        confirmations={2}
        buttonText="Request to Migrate the RDA"
        inputLabel="Migration target address"
        inputType="address"
        buttonCallback={this.props.migrate}
        callbackArgs={[rda.address, this.props.auth.account]}
      />
    )

    return [...isRecommendedActions.true, ...isRecommendedActions.false]
  }

  render() {
    const {isLoading} = this.props.auth
    const rda = this.props.rda.selected
    const {web3} = this.state
    if (!web3) return null
    if (isLoading) {
      return <PageLoader/>
    } else if (!rda || !rda.address) {
      return <Redirect to={"/home"}/>
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
            <Heading>Actions for Rental Deposit Account</Heading>
            <Text
              fontWeight="bold"
              my={[1, 1, 2]}
              mx="auto"
              width={[9 / 10, 9 / 10, 3 / 4]}
              address={rda.address}
            >{rda.address}</Text>
          </Box>
          <Box mb={4} textAlign="blockquote">
            <Box mx="auto" width={9 / 10}>
              <Text>
                Here you can initiate or request different actions for this RDA. The actions are
                sorted in rough order of preference. Additionally, the actions which are not
                recommended for you have been grayed out.
                You can still use them if the conditions are met, but you usually don't
                have an incentive to do so.<br/>
                For more details, please read the FAQ.
              </Text>
            </Box>
          </Box>
          {this.sortActions()}
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
  {withdrawInterest, withdrawTrusteeFee, fundContract, selectRda, startRda, returnDeposit, payDamages, migrate},
)(Actions)