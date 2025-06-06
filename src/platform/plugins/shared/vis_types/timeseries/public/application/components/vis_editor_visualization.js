/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  keys,
  EuiFlexGroup,
  EuiIcon,
  EuiFlexItem,
  EuiButton,
  EuiText,
  EuiSwitch,
} from '@elastic/eui';
import { FormattedMessage, injectI18n } from '@kbn/i18n-react';
import { pluck } from 'rxjs';
import { css } from '@emotion/react';

export const editorVisualizationStyle = ({ euiTheme }) => css`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
  width: 100%;
  height: calc(${euiTheme.size.l} * 10);
  line-height: normal;
  background-color: ${euiTheme.colors.emptyShade};
  overflow: auto;
`;

export const applyStyle = ({ euiTheme }) => css`
  padding: ${euiTheme.size.s};
`;

const dragHandleStyle = ({ euiTheme }) => {
  // Implementing the kbnResizer mixin with vertical direction

  // Default size calculation (euiSizeM + 2px)
  const defaultSize = `calc(${euiTheme.size.m} + 2px)`;

  // Implementation for vertical direction
  return css`
    position: relative;
    display: flex;
    flex: 0 0 ${defaultSize};
    background-color: ${euiTheme.colors.body};
    align-items: center;
    justify-content: center;
    margin: 0;
    user-select: none;

    height: ${defaultSize};
    width: 100%;

    &:hover {
      background-color: ${euiTheme.colors.backgroundBasePrimary};
    }

    &:focus,
    &:active {
      background-color: ${euiTheme.colors.primary};
      color: ${euiTheme.colors.emptyShade};
    }

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      cursor: ns-resize;
    }
  `;
};

const MIN_CHART_HEIGHT = 300;

class VisEditorVisualizationUI extends Component {
  constructor(props) {
    super(props);
    this.state = {
      height: MIN_CHART_HEIGHT,
      dragging: false,
    };

    this._visEl = React.createRef();
    this._subscription = null;
  }

  handleMouseDown = () => {
    window.addEventListener('mouseup', this.handleMouseUp);
    this.setState({ dragging: true });
  };

  handleMouseUp = () => {
    window.removeEventListener('mouseup', this.handleMouseUp);
    this.setState({ dragging: false });
  };

  handleMouseMove = (event) => {
    if (this.state.dragging) {
      this.setState((prevState) => ({
        height: Math.max(MIN_CHART_HEIGHT, prevState.height + event.movementY),
      }));
    }
  };

  async _loadVisualization() {
    if (!this._visEl.current) {
      // In case the visualize loader isn't done before the component is unmounted.
      return;
    }

    const { onDataChange, embeddableHandler, timeRange, filters, query } = this.props;

    this._handler = embeddableHandler;
    this._handler.updateInput({ timeRange, filters, query });
    await this._handler.render(this._visEl.current);
    this.props.eventEmitter.emit('embeddableRendered');

    this._subscription = this._handler.handler.data$
      .pipe(pluck('result'))
      .subscribe((data) => onDataChange(data.value));
  }

  /**
   * Resize the chart height when pressing up/down while the drag handle
   * for resizing has the focus.
   * We use 15px steps to do the scaling and make sure the chart has at least its
   * defined minimum width (MIN_CHART_HEIGHT).
   */
  onSizeHandleKeyDown = (ev) => {
    const { key } = ev;
    if (key === keys.ARROW_UP || key === keys.ARROW_DOWN) {
      ev.preventDefault();
      this.setState((prevState) => {
        const newHeight = prevState.height + (key === keys.ARROW_UP ? -15 : 15);
        return {
          height: Math.max(MIN_CHART_HEIGHT, newHeight),
        };
      });
    }
  };

  componentWillUnmount() {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    if (this._handler) {
      this._handler.destroy();
    }
    if (this._subscription) {
      this._subscription.unsubscribe();
    }
  }

  componentDidMount() {
    window.addEventListener('mousemove', this.handleMouseMove);
    this._loadVisualization();
  }

  componentDidUpdate() {
    if (this._handler) {
      const { timeRange, filters, query } = this.props;
      this._handler.updateInput({ timeRange, filters, query });
    }
  }

  render() {
    const { dirty, autoApply, title, description, onToggleAutoApply, onCommit } = this.props;
    const style = { height: this.state.height };

    if (this.state.dragging) {
      style.userSelect = 'none';
    }

    let applyMessage = (
      <FormattedMessage
        id="visTypeTimeseries.visEditorVisualization.changesSuccessfullyAppliedMessage"
        defaultMessage="The latest changes have been applied."
      />
    );
    if (dirty) {
      applyMessage = (
        <FormattedMessage
          id="visTypeTimeseries.visEditorVisualization.changesHaveNotBeenAppliedMessage"
          defaultMessage="The changes to this visualization have not been applied."
        />
      );
    }
    if (autoApply) {
      applyMessage = (
        <FormattedMessage
          id="visTypeTimeseries.visEditorVisualization.changesWillBeAutomaticallyAppliedMessage"
          defaultMessage="The changes will be automatically applied."
        />
      );
    }
    const applyButton = (
      <EuiFlexGroup className="tvbEditorVisualization__apply" css={applyStyle} alignItems="center">
        <EuiFlexItem grow={true}>
          <EuiSwitch
            id="tsvbAutoApplyInput"
            label={
              <FormattedMessage
                id="visTypeTimeseries.visEditorVisualization.autoApplyLabel"
                defaultMessage="Auto apply"
              />
            }
            checked={autoApply}
            onChange={onToggleAutoApply}
          />
        </EuiFlexItem>

        <EuiFlexItem grow={false}>
          <EuiText color={dirty ? 'default' : 'subdued'} size="xs">
            <p>{applyMessage}</p>
          </EuiText>
        </EuiFlexItem>

        {!autoApply && (
          <EuiFlexItem grow={false}>
            <EuiButton
              iconType="play"
              fill
              size="s"
              onClick={onCommit}
              disabled={!dirty}
              data-test-subj="applyBtn"
            >
              <FormattedMessage
                id="visTypeTimeseries.visEditorVisualization.applyChangesLabel"
                defaultMessage="Apply changes"
              />
            </EuiButton>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    );

    return (
      <div>
        <div
          style={style}
          className="tvbEditorVisualization"
          css={editorVisualizationStyle}
          data-shared-items-container
          data-title={title}
          data-description={description}
          ref={this._visEl}
        />
        <div className="tvbEditor--hideForReporting">
          {applyButton}
          <button
            className="tvbEditorVisualization__draghandle"
            css={dragHandleStyle}
            onMouseDown={this.handleMouseDown}
            onMouseUp={this.handleMouseUp}
            onKeyDown={this.onSizeHandleKeyDown}
            aria-label={this.props.intl.formatMessage({
              id: 'visTypeTimeseries.colorRules.adjustChartSizeAriaLabel',
              defaultMessage: 'Press up/down to adjust the chart size',
            })}
          >
            <EuiIcon type="grab" />
          </button>
        </div>
      </div>
    );
  }
}

VisEditorVisualizationUI.propTypes = {
  model: PropTypes.object,
  onCommit: PropTypes.func,
  uiState: PropTypes.object,
  onToggleAutoApply: PropTypes.func,
  embeddableHandler: PropTypes.object,
  eventEmitter: PropTypes.object,
  timeRange: PropTypes.object,
  dirty: PropTypes.bool,
  autoApply: PropTypes.bool,
};

export const VisEditorVisualization = injectI18n(VisEditorVisualizationUI);
