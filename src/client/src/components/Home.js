import React, {Component} from "react"
import {connect} from "react-redux"
import {Card, Text} from "rimble-ui"
import NoMetamask from "./NoMetamask"
import {loadRdas} from "../actions/rdaActions"

class Home extends Component {

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.auth.address !== this.props.auth.address && this.props.auth.address != null) {
            const {address} = this.props.auth
            if (address) {
                this.props.loadRdas(address)
            }
        }

    }

    render() {
        const {isMetamask} = this.props.auth
        return (
            isMetamask ?
                <Card width={"auto"} maxWidth={"800px"} mx={"auto"} bg={"dark-gray"} px={[3, 3, 4]} border={"none"}>
                    <Text ></Text>
                    {/*<Box p={3} width={1} color="salmon" bg="gray">*/}
                    {/*    Box*/}
                    {/*</Box>*/}
                </Card>
                :
                <NoMetamask/>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    return ({
        auth: state.auth,
    })
}

export default connect(
    mapStateToProps,
    {loadRdas},
)(Home)