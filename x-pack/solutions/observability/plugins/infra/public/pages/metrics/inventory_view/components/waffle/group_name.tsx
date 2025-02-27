/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiLink, EuiToolTip, useEuiFontSize } from '@elastic/eui';
import React from 'react';
import styled from '@emotion/styled';
import type {
  InfraWaffleMapGroup,
  InfraWaffleMapOptions,
} from '../../../../../common/inventory/types';

interface Props {
  onDrilldown: (filter: string) => void;
  group: InfraWaffleMapGroup;
  isChild?: boolean;
  options: InfraWaffleMapOptions;
}

export class GroupName extends React.PureComponent<Props, {}> {
  public render() {
    const { group, isChild } = this.props;
    const linkStyle = {
      fontSize: isChild ? '0.85em' : '1em',
    };
    return (
      <GroupNameContainer>
        <Inner isChild={isChild}>
          <Name>
            <EuiToolTip position="top" content={group.name}>
              <EuiLink
                style={linkStyle}
                onClickCapture={this.handleClick}
                data-test-subj="groupNameLink"
              >
                {group.name}
              </EuiLink>
            </EuiToolTip>
          </Name>
          <Count>{group.count}</Count>
        </Inner>
      </GroupNameContainer>
    );
  }

  private handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const { groupBy } = this.props.options;
    // When groupBy is empty that means there is nothing todo so let's just do nothing.
    if (groupBy.length === 0) {
      return;
    }
    const currentPath = this.props.isChild && groupBy.length > 1 ? groupBy[1] : groupBy[0];
    this.props.onDrilldown(`${currentPath.field}: "${this.props.group.name}"`);
  };
}

const GroupNameContainer = styled.div`
  position: relative;
  text-align: center;
  font-size: ${(props) => useEuiFontSize('m').fontSize};
  margin-bottom: 5px;
  top: 20px;
  display: flex;
  justify-content: center;
  padding: 0 10px;
`;

interface InnerProps {
  isChild?: boolean;
}

const Inner = styled.div<InnerProps>`
  border: ${(props) => props.theme.euiTheme.border.thin};
  background-color: ${(props) =>
    props.isChild
      ? props.theme.euiTheme.colors.lightestShade
      : props.theme.euiTheme.colors.emptyShade};
  border-radius: 4px;
  box-shadow: 0px 2px 0px 0px ${(props) => props.theme.euiTheme.border.color};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const Name = styled.div`
  flex: 1 1 auto;
  padding: 6px 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Count = styled.div`
  flex: 0 0 auto;
  border-left: ${(props) => props.theme.euiTheme.border.thin};
  padding: 6px 10px;
  font-size: ${() => useEuiFontSize('xs').fontSize};
  font-weight: normal;
`;
