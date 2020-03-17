import React, {Component} from "react"
import styled from "styled-components"
import {Input, Flex, Box, Tooltip, Button, Icon} from "rimble-ui"
import Clipboard from "./CopyToClipboard"

const StyledInput = styled(Input)`
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledWrapper = styled(Box)`
  & {
    display: flex;
    flex-direction: row;
    align-items: center;
    position: relative;
  }
`;

export const CopyButton = ({ clipboardText, ...props }) => {
  const text = {
    tooltip: 'Copy to clipboard',
    button: 'Copy',
  };

  if (!props.textLabels) {
    return (
      <Clipboard text={clipboardText}>
        {isCopied => (
          <Tooltip message={text.tooltip}>
            <Button size={'small'} p={0}>
              <Icon name={isCopied ? 'Check' : 'Assignment'} />
            </Button>
          </Tooltip>
        )}
      </Clipboard>
    );
  }
  return (
    <Clipboard text={clipboardText}>
      {isCopied => (
        <Button size={'small'}>{!isCopied ? text.button : 'Copied!'}</Button>
      )}
    </Clipboard>
  );
};

class EthAddress extends Component {

  render() {
    return (
      <StyledWrapper {...this.props}>
        <StyledInput
          readOnly
          border={this.props.inputBorder}
          bg={this.props.inputBg}
          value={this.props.address}
          ref={this.inputRef}
          width={1}
          fontWeight={3}
          p={'auto'}
          pl={3}
          pr={this.props.textLabels ? '12rem' : '6rem'}
        />

        <Flex position={'absolute'} right={0} mr={2}>
          <CopyButton
            clipboardText={this.props.address}
            textLabels={this.props.textLabels}
          />
          {/*<QRButton*/}
          {/*  address={this.props.address}*/}
          {/*  textLabels={this.props.textLabels}*/}
          {/*/>*/}
        </Flex>
      </StyledWrapper>
    )
  }
}

export default EthAddress
