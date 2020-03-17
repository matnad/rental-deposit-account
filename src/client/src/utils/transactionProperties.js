// import React from "react"

export const TxnType = Object.freeze({
  INVALID: "invalid",
  CREATE_RDA: "createRda",
  SUBMIT_TXN: "submitTxn",
  CONFIRM_TXN: "confirmTxn",
  WITHDRAW_INTEREST: "withdrawInterest",
  WITHDRAW_TRUSTEEFEE: "withdrawTrusteeFee",
  FUND_CONTRACT: "fundContract",
  START: "start",

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
    default:
      return "Transaction Failed"
  }
}