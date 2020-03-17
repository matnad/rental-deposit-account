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
    default:
      return (
        <Text>
          An unknown error has occurred. Please check the console or look up the transaction
          hash: {txn.hash}
        </Text>
      )
  }
}