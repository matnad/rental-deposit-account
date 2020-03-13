import {RDAS_LOADED, RDAS_LOADING} from "./types"
import RDARegistry from "../contracts/RDARegistry"
import {getEthereum} from "../utils/getEthereum"
import Web3 from "web3"
import {desiredNetworks} from "../utils/settings"

export const loadRdas = (account) => (dispatch) => {

    dispatch({type: RDAS_LOADING})

    async function getRdas() {
        const web3 = new Web3(await getEthereum())
        const chainId = (await web3.eth.net.getId()).toString()

        if(!desiredNetworks.includes(chainId)) {
            return []
        }

        const deployedNetwork = RDARegistry.networks[chainId]
        const registry = new web3.eth.Contract(
            RDARegistry.abi,
            deployedNetwork && deployedNetwork.address,
        )
        return await registry.methods.getByParticipant(account).call()

    }


    getRdas()
        .then(rdas => {
            dispatch({
                type: RDAS_LOADED,
                payload: rdas
            })
        })
}