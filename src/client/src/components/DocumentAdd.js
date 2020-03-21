import React, {Component} from "react"
import {connect} from "react-redux"
import {Box, Button, Card, Form, Heading, Input, Loader, Text} from "rimble-ui"
import {selectRda} from "../actions/rdaActions"
import web3Utils from "web3-utils"
import PageLoader from "./PageLoader"
import {Redirect} from "react-router-dom"
import {addDocument} from "../actions/transactionActions"

class DocumentAdd extends Component {

  constructor(props) {
    super(props)
    this.state = {
      selectedFile: null,
      hash: "",
      name: "",
      isLoading: false
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevState.selectedFile !== this.state.selectedFile && this.state.selectedFile != null) {
      // console.log(this.state.selectedFile)
      this.state.selectedFile.text().then(file => {
        this.setState({
          hash: web3Utils.keccak256(file),
          isLoading: false
        })
      })
    }
  }

  handleSubmit(e) {
    e.preventDefault()
    this.props.addDocument(
      web3Utils.utf8ToHex(this.state.name),
      this.state.hash,
      this.props.rda.selected.address,
      this.props.auth.account
    )
  }

  fileHandler(e) {
    this.setState({
      selectedFile: e.target.files[0],
      hash: "",
      isLoading: true
    })
    this.handleNameChange(e.target.files[0].name)
  }

  isFormValid() {
    try {
      return Buffer.byteLength(this.state.hash) === 66 && this.state.name.length > 0
    } catch (e) {
      return false
    }
  }

  handleNameChange(name) {
    const encoded = web3Utils.utf8ToHex(name)
    if (encoded.length > 66) {
      const shortened = encoded.slice(0, 66)
      name = web3Utils.hexToUtf8(shortened)
    }
    this.setState({name})
  }

  render() {
    const {isLoading} = this.props.auth
    const rda = this.props.rda.selected
    if (isLoading) {
      return <PageLoader/>
    } else if (!rda || !rda.address) {
      return <Redirect to={"/home"}/>
    }
    return (
      <Card
        width={3 / 4}
        mx={"auto"}
        bg={"dark-gray"}
        px={[3, 3, 4]}
        border={"none"}
      >
        <Box textAlign="center">
          <Box mb={4}>
            <Heading>Add a document hash to the RDA</Heading>
          </Box>
          <Box width={1} px={3}>
            <Text fontWeight="bold" mb={1}>Calculate the Hash from a local file</Text>
            <Text mb={3} fontSize="0.85em">
              <i>The file will not be uploaded, submitted or opened. The keccak256 hash will be created on your local
                machine.</i>
            </Text>
            <Input onChange={(e) => this.fileHandler(e)} type="file"/>

            <Form onSubmit={(e) => this.handleSubmit(e)}>
              <Text mt={4} mb={3} fontSize="0.85em">
                <i>The calculated keccak256 hash is displayed here. Alternatively, you can calculate it yourself and paste it.</i>
              </Text>
              {
                this.state.isLoading ?
                  <Loader mx="auto" size="2em"/> :
                  <Input width={1} type="text" value={this.state.hash}
                         onChange={(e) => this.setState({hash: e.target.value})}/>
              }
              <Text mt={4} mb={3} fontSize="0.85em">
                <i>Give the document a short and concise name.</i>
              </Text>
              <Box width={1}>
                <Input width={1 / 2} type="text" value={this.state.name}
                       onChange={(e) => this.handleNameChange(e.target.value)}/>
              </Box>
              <Button mt={4} type="submit" disabled={!this.isFormValid()}>
                Attach Document to this RDA
              </Button>
            </Form>
          </Box>
        </Box>
      </Card>
    )
  }
}

const mapStateToProps = (state) => {
  return ({
    auth: state.auth,
    rda: state.rda
  })
}

export default connect(
  mapStateToProps,
  {selectRda, addDocument},
)(DocumentAdd)