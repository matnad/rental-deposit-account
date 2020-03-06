# Seminar Thesis
**Matthias Nadler, University of Basel**

**Supervised by:**   
Prof. Dr. Fabian Schär  
Credit Suisse Asset Management (Schweiz) Professor for Distributed Ledger Technologies and Fintech  
Center for Innovative Finance, University of Basel
## Smart contract for a rental deposit account with multisig and interest
The goal is to create a smart contract that manages a rental deposit in DAI on the Ethereum blockchain.

### Involved Parties:
* **Tenant:** Rents a property, deposits DAI on the contract, holds claim for interest
* **Landlord:** Rents out a property, has claims to the deposit as collateral
* **Trustee:** Demands a fee to set up off-chain contracts with all parties and confirms multisig transactions

The precise division of responsibilities and an analysis of incentives for the involved parties will be performed in the written thesis.

### Overview
The deposit is safely invested (DAI-DSR) with the interest profits belonging to the tenant. 
The fee for the trustee is paid with the accruing interest on the contract, or taken from the deposit in case of an early termination.

The following transactions require multiple signatures/confirmations:
* **Return Deposit:** Returns the deposit to the tenant, holding back any pending fees. Needs to be confirmed by any two parties.
* **Pay Damages:** An amount of up to the full deposit is transferred to the landlord as collateral. Needs to be confirmed by any two parties.
* **Migrate:** Migrate all funds to a new version of the contract (or to any other address). Needs confirmation of the trustee and one other party.

To support multisig, the following public functions are implemented:
`submitTransaction<TxnType>, confirmTransaction, revokeConfirmation, executeTransaction`

The following transactions can be executed at any time by all participants:
* **Withdraw Trustee Fee**: An amount of up to the remaining fee is transferred to the trustee. This can't reduce the deposit below its initial amount.
* **Withdraw Interest**: The amount greater than the remaining deposit, minus pending fees are transferred to the tenant. Pending fees are held back (the trustee has priority).
 
## Installing the repository
1.) Clone the repository and install the node modules:
```
git clone https://github.com/matnad/rental-deposit-account.git
cd src
npm install
```

2.) Set up a local blockchain with all the MakerDAO contracts deployed. For example: https://github.com/makerdao/testchain

3.) Create an `.env` file in the `/src/` directory that holds these variables:
```
RPC_URL=http://domain.example/path  # http(s) based rpc node to connect to
RPC_HOST=domain.example/path        # the same node, but without the http(s)
RPC_PORT=80                         # currently only port 80 is supported
```

4.) Read the documentation on tests below

5.) Use truffle (make sure it is installed with `npm install -g truffle` first) to interact with the repository or run the tests with npm scripts (see `package.json`):
```
npm run test_<nameoftest>  # example: npm run test_ensuredai
```

6.) Run scripts with:
```
truffle exec scripts/<nameOfFile.js>
```

## Documentation for tests
The tests are separated into different categories with the first digit of the file name specifying the category.

### Category: Setup (00-09)
Tests that need to be run every time the local blockchain is reset or once funds are used up (other tests will fail). They will for example ensure DAI is distributed to the 0th test account. 

### Category: Unit tests for modular parts (10-19)
Tests for modular parts of the contract like the DSR saving or the multisig.

### Category: Unit tests for integrated contract logic (20-29)
Tests for the module integration and core logic of the contract. They try to cover as many edge cases as possible.

### Category: Story driven tests (30-39)
Tests that follow a realistic scenario (story), testing the contract from start to finish under different scenarios with participants trying to break the contract when an opportunity presents itself.