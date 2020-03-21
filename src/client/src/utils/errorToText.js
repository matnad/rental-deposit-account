import React from "react"
import {Text} from "rimble-ui"

export const getErrorMessage = (txn) => {
  switch (txn.revertReason) {
    case "RDA/not-active":
      return (
        <>
          <Text mb={2}>The Rental deposit account you are trying to interact with is not yet active.</Text>
          <Text>To resolve this issue, make sure the contract has the required DAI balance and use the "Start" action.
          </Text>
        </>
      )
    case "RDA/not-allowed":
      return (
        <>
          <Text mb={2}>Only accounts directly involved with the Rental Deposit Account can use this action.</Text>
          <Text>If you are not the tenant, landlord or trustee, you are not allowed to use this action.</Text>
        </>
      )
    case "RDA/txn-invalid":
      return (
        <>
          <Text mb={2}>The request or document you are trying to interact with does not exist.</Text>
          <Text>This is likely due to a bug in the interface or due to a manual change.
            Clear your local storage and try again.</Text>
        </>
      )
    case "RDA/txn-not-confirmed":
      return (
        <>
          <Text mb={2}>You are trying to interact with a request that should be confirmed, but it is not.</Text>
          <Text>You can only execute transactions that you have confirmed yourself.</Text>
        </>
      )
    case "RDA/txn-confirmed":
      return (
        <>
          <Text mb={2}>You are trying to interact with a request that should not be confirmed, but it is.</Text>
          <Text>You can only only confirm actions that you don't currently have confirmed.</Text>
        </>
      )
    case "RDA/txn-executed":
      return (
        <>
          <Text mb={2}>You are trying to interact with a transaction that has already been executed.</Text>
          <Text>You can not confirm or revoke confirmation for an executed transaction.</Text>
        </>
      )
    case "RDA/illegal-for-doc":
      return (
        <>
          <Text mb={2}>You are trying to use an action for a document that is not allowed.</Text>
          <Text>Documents can't be executed and the signing can't be undone.</Text>
        </>
      )
    case "RDA/empty-address":
      return (
        <>
          <Text mb={2}>You must provide three valid addresses to create a Rental Deposit Account.</Text>
        </>
      )
    case "RDA/duplicate-addresses":
      return (
        <>
          <Text mb={2}>The tenant, landlord and trustee addresses must be different.</Text>
        </>
      )
    case "RDA/already-started":
      return (
        <>
          <Text mb={2}>You tried to start an RDA that was already started.</Text>
        </>
      )
    case "RDA/no-dai-found":
      return (
        <>
          <Text mb={2}>You can only start a Rental Deposit Account if it has a positive DAI balance.</Text>
          <Text>Transfer DAI to the RDA and then try again.</Text>
        </>
      )
    case "DSR/not-authorized":
      return (
        <>
          <Text mb={2}>You are trying to lock DAI into the pot, but didn't authorize the contract.</Text>
          <Text>Run dsrAuthorize() to fix this issue.</Text>
        </>
      )
    default:
      return (
        <Text>
          The transaction was reverted with this message: {txn.revertReason}.
          Please check the console or look up the transaction hash: {txn.hash}
        </Text>
      )
  }
}