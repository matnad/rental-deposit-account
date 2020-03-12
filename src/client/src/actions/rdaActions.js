import {} from "./types"
import getWeb3 from "../getWeb3"
import RDARegistry from "../contracts/RDARegistry"

export const loadRdas = (address) => dispatch => {
    async function getRdas() {
        console.log("rda")
        const web3 = await getWeb3(false)
        console.log(web3)
        const networkId = await web3.eth.net.getId()

        const deployedNetwork = RDARegistry.networks[networkId]
        const registry = new web3.eth.Contract(
            RDARegistry.abi,
            deployedNetwork && deployedNetwork.address,
        )
        const rdas = await registry.methods.getByParticipant(address).call()
        console.log(rdas)
    }

    getRdas()
        .then(res => console.log("succ"))
}