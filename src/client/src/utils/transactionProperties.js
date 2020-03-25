// import React from "react"

export const ConfirmationType = Object.freeze({
  RETURN_DEPOSIT: "0",
  PAY_DAMAGES: "1",
  MIGRATE: "2",
  DOCUMENT: "3",
})

export const TxnType = Object.freeze({
  INVALID: "invalid",
  CREATE_RDA: "createRda",
  WITHDRAW_INTEREST: "withdrawInterest",
  WITHDRAW_TRUSTEEFEE: "withdrawTrusteeFee",
  FUND_CONTRACT: "fundContract",
  START: "start",
  RETURN_DEPOSIT: "returnDeposit",
  PAY_DAMAGES: "payDamages",
  ADD_DOCUMENT: "addDocument",
  MIGRATE: "migrate",
  CONFIRM: "confirm",
  REVOKE: "revoke",
  EXECUTE: "execute",
})

export const ModalType = Object.freeze({
  NONE: "none",
  CONFIRM: "confirm",
  PROGRESS: "progress",
  SUCCESS: "success",
  ERROR: "error",
})

export const Status = Object.freeze({
  INVALID: "invalid",
  WAITING: "waiting",
  CONFIRMED: "confirmed",
  REJECTED: "rejected",
  PENDING: "pending",
  REVERTED: "reverted",
  FAILED: "failed",
  COMPLETED: "completed",
})

export const getTransactionInfo = (txnType) => {
  return {
    pendingTitle: getPendingTitle(txnType),
    pendingSubtitle: getPendingSubtitle(txnType),
    confirmTitle: getConfirmTitle(txnType),
    confirmSubTitle: getConfirmSubtitle(txnType),
    progressType: getProgressType(txnType),
    successToastTitle: getSuccessToastTitle(txnType),
    successToastSubTitle: getSuccessToastSubtitle(txnType),
    successTitle: getSuccessTitle(txnType),
    button: getSuccessButton(txnType),
    failureTitle: getFailureTitle(txnType),
    payloadTitles: getPayloadTitles(txnType),
  }
}

function getPendingTitle(txnType) {
  switch (txnType) {
    case TxnType.CREATE_RDA:
      return "Your Rental Deposit Account is being opened"
    case TxnType.WITHDRAW_INTEREST:
      return "Your interest is being withdrawn"
    case TxnType.WITHDRAW_TRUSTEEFEE:
      return "Your Fee is being collected"
    case TxnType.FUND_CONTRACT:
      return "RDA is being funded"
    case TxnType.START:
      return "Starting your RDA"
    case TxnType.RETURN_DEPOSIT:
    case TxnType.PAY_DAMAGES:
    case TxnType.MIGRATE:
      return "Request is being deployed"
    case TxnType.CONFIRM:
      return "Confirmation is in progress"
    case TxnType.REVOKE:
      return "Revocation in progress"
    case TxnType.EXECUTE:
      return "Action is being executed"
    case TxnType.ADD_DOCUMENT:
      return "Document hash is being added."
    default:
      return "Transaction is being processed"
  }
}

function getPendingSubtitle(txnType) {
  switch (txnType) {
    case TxnType.CREATE_RDA:
      return "Very nice! It should be ready soon."
    case TxnType.WITHDRAW_INTEREST:
      return "Very nice! It should be in your wallet soon!"
    case TxnType.WITHDRAW_TRUSTEEFEE:
      return "Very nice! It should be in your wallet soon!"
    case TxnType.FUND_CONTRACT:
      return "Your deposit should arrive shortly!"
    case TxnType.START:
      return "The DAI is being locked in the DSR contract and you will start earning interest immediately!"
    case TxnType.RETURN_DEPOSIT:
    case TxnType.PAY_DAMAGES:
    case TxnType.MIGRATE:
      return "Once the request is finished, other participants will have to confirm it."
    case TxnType.CONFIRM:
      return "Once the request is confirmed, it can be execute if it has two or more confirmations."
    case TxnType.REVOKE:
      return "You can switch freely between confirmation and revocation."
    case TxnType.EXECUTE:
      return "Very nice! This should be processed shortly."
    case TxnType.ADD_DOCUMENT:
      return "Nice! It should be linked shortly."
    default:
      return "Excellent! This should be processed soon."
  }
}

function getConfirmTitle(txnType) {
  switch (txnType) {
    case TxnType.CREATE_RDA:
      return "Confirm the new RDA in MetaMask"
    case TxnType.FUND_CONTRACT:
      return "Confirm the DAI transfer in MetaMask"
    case TxnType.START:
      return "Confirm to start the RDA in MetaMask"
    case TxnType.PAY_DAMAGES:
    case TxnType.MIGRATE:
      return "Confirm your request in MetaMask"
    default:
      return "Confirm this transaction in MetaMask"
  }
}

function getConfirmSubtitle(txnType) {
  switch (txnType) {
    case TxnType.CREATE_RDA:
      return "Double check the details here - this transaction can't be refunded."
    case TxnType.WITHDRAW_INTEREST:
      return "The funds will always be sent to the wallet of the tenant, no matter who activates this action."
    case TxnType.WITHDRAW_TRUSTEEFEE:
      return "The funds will always be sent to the wallet of the trustee, no matter who activates this action."
    case TxnType.FUND_CONTRACT:
      return "Double check the details here and in MetaMask (especially the DAI amount) - this transaction can't be refunded!"
    case TxnType.START:
      return "Double check the details here and make sure the RDA has the correct DAI balance - this transaction can't be refunded."
    case TxnType.RETURN_DEPOSIT:
    case TxnType.PAY_DAMAGES:
    case TxnType.MIGRATE:
      return "Double check the details here - this transaction can't be refunded."
    case TxnType.EXECUTE:
      return "Double check the details here - this transaction can't be refunded or reverted."
    default:
      return "Double check the details here – this transaction can't be refunded."
  }
}

function getProgressType(txnType) {
  switch (txnType) {
    case TxnType.CREATE_RDA:
      return "New Rental Deposit Account"
    case TxnType.WITHDRAW_INTEREST:
      return "Withdrawing Interest"
    case TxnType.WITHDRAW_TRUSTEEFEE:
      return "Collecting Trustee Fee"
    case TxnType.FUND_CONTRACT:
      return "Transferring DAI to Deposit"
    case TxnType.START:
      return "Starting the RDA"
    case TxnType.RETURN_DEPOSIT:
      return "Submitting Request"
    case TxnType.PAY_DAMAGES:
      return "Submitting Request"
    case TxnType.MIGRATE:
      return "Submitting Request"
    case TxnType.CONFIRM:
      return "Confirmation"
    case TxnType.REVOKE:
      return "Revocation"
    case TxnType.EXECUTE:
      return "Executing Request"
    case TxnType.ADD_DOCUMENT:
      return "Adding Document"
    default:
      return "Transaction"
  }
}

function getSuccessToastTitle(txnType) {
  switch (txnType) {
    case TxnType.CREATE_RDA:
      return "Contract has been created"
    case TxnType.WITHDRAW_INTEREST:
      return "Interest withdrawn"
    case TxnType.WITHDRAW_TRUSTEEFEE:
      return "Trustee Fee Collected"
    case TxnType.FUND_CONTRACT:
      return "Deposit has been funded"
    case TxnType.START:
      return "Your RDA is now live"
    case TxnType.RETURN_DEPOSIT:
    case TxnType.PAY_DAMAGES:
    case TxnType.MIGRATE:
      return "Request has been submitted"
    case TxnType.CONFIRM:
      return "Confirmation recorded"
    case TxnType.REVOKE:
      return "Confirmation revoked"
    case TxnType.EXECUTE:
      return "Request executed"
    case TxnType.ADD_DOCUMENT:
      return "Document added"
    default:
      return "Transaction completed"
  }
}

function getSuccessToastSubtitle(txnType) {
  switch (txnType) {
    case TxnType.CREATE_RDA:
      return "Your Rental Deposit Account is ready!"
    case TxnType.WITHDRAW_INTEREST:
      return "The the funds are now in your wallet!"
    case TxnType.WITHDRAW_TRUSTEEFEE:
      return "The the funds are now in your wallet!"
    case TxnType.FUND_CONTRACT:
      return "You can now start the deposit"
    case TxnType.START:
      return "It already started generating interest"
    case TxnType.RETURN_DEPOSIT:
    case TxnType.PAY_DAMAGES:
    case TxnType.MIGRATE:
      return "Other participants can now confirm it"
    case TxnType.CONFIRM:
    case TxnType.REVOKE:
      return "Track the status under \"Requests\""
    case TxnType.EXECUTE:
      return "Check the updated details of the RDA"
    case TxnType.ADD_DOCUMENT:
      return "Check the status under \"Documents\""
    default:
      return "Transaction"
  }
}

function getSuccessTitle(txnType) {
  switch (txnType) {
    case TxnType.CREATE_RDA:
      return "Your Rental Deposit Account is ready!"
    case TxnType.WITHDRAW_INTEREST:
      return "The interest is withdrawn to your wallet!"
    case TxnType.WITHDRAW_TRUSTEEFEE:
      return "The trustee fee has been collected!"
    case TxnType.FUND_CONTRACT:
      return "The RDA has been successfully funded!"
    case TxnType.START:
      return "The RDA is now live!"
    case TxnType.RETURN_DEPOSIT:
      return "Return Deposit request submitted!"
    case TxnType.PAY_DAMAGES:
      return "Pay Landlord request submitted!"
    case TxnType.MIGRATE:
      return "Migration request submitted!"
    case TxnType.CONFIRM:
      return "Confirmation submitted!"
    case TxnType.EXECUTE:
      return "Request has been executed!"
    case TxnType.ADD_DOCUMENT:
      return "Document is now linked!"
    default:
      return "Transaction"
  }
}

function getSuccessButton(txnType) {
  switch (txnType) {
    case TxnType.CREATE_RDA:
      return {text: "Work with the new contract"}
    default:
      return null
  }
}

function getFailureTitle(txnType) {
  switch (txnType) {
    case TxnType.CREATE_RDA:
      return "There was a problem creating your RDA"
    case TxnType.WITHDRAW_INTEREST:
      return "There was a problem withdrawing your interest"
    case TxnType.WITHDRAW_TRUSTEEFEE:
      return "There was a problem collecting your fee"
    case TxnType.FUND_CONTRACT:
      return "There was a problem sending DAI to the RDA"
    case TxnType.START:
      return "There was a problem starting the RDA"
    case TxnType.RETURN_DEPOSIT:
    case TxnType.PAY_DAMAGES:
    case TxnType.MIGRATE:
      return "There was a problem opening your request"
    case TxnType.CONFIRM:
      return "There was a problem confirming the request"
    case TxnType.REVOKE:
      return "There was a problem revoking the confirmation"
    case TxnType.EXECUTE:
      return "There was a problem executing the request"
    case TxnType.ADD_DOCUMENT:
      return "There was a problem adding the document"
    default:
      return "Transaction Failed"
  }
}

function getPayloadTitles(txnType) {
  switch (txnType) {
    case TxnType.CREATE_RDA:
      return ["Tenant", "Landlord", "Trustee"]
    case TxnType.PAY_DAMAGES:
      return ["Compensation amount"]
    case TxnType.MIGRATE:
      return ["New Address"]
    default:
      return []
  }
}