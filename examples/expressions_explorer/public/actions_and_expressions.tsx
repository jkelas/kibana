/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useState } from 'react';
import {
  EuiFlexItem,
  EuiFlexGroup,
  EuiPageBody,
  EuiPageTemplate,
  EuiPageSection,
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiPanel,
  EuiText,
  EuiTitle,
  EuiSpacer,
} from '@elastic/eui';
import { ExpressionsStart } from '@kbn/expressions-plugin/public';
import { UiActionsStart } from '@kbn/ui-actions-plugin/public';
import { ExpressionEditor } from './editor/expression_editor';
import { NAVIGATE_TRIGGER_ID } from './actions/navigate_trigger';

interface Props {
  expressions: ExpressionsStart;
  actions: UiActionsStart;
}

export function ActionsExpressionsExample({ expressions, actions }: Props) {
  const [expression, updateExpression] = useState(
    'button name="click me" href="http://www.google.com"'
  );

  const expressionChanged = (value: string) => {
    updateExpression(value);
  };

  const handleEvents = (event: any) => {
    if (event.name !== 'NAVIGATE') return;
    // enrich event context with some extra data
    event.baseUrl = 'http://www.google.com';

    actions.getTrigger(NAVIGATE_TRIGGER_ID).exec(event.data);
  };

  return (
    <EuiPageBody>
      <EuiPageHeader>
        <EuiPageHeaderSection>
          <EuiTitle size="l">
            <h1>Actions from expression renderers</h1>
          </EuiTitle>
        </EuiPageHeaderSection>
      </EuiPageHeader>
      <EuiPageTemplate.Section data-test-subj="expressionsActionsTest">
        <EuiPageSection>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiText>
                Here you can play with sample `button` which takes a url as configuration and
                displays a button which emits custom BUTTON_CLICK trigger to which we have attached
                a custom action which performs the navigation.
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiSpacer />

          <EuiFlexGroup gutterSize="l">
            <EuiFlexItem>
              <EuiPanel data-test-subj="expressionEditor" paddingSize="none" role="figure">
                <ExpressionEditor value={expression} onChange={expressionChanged} />
              </EuiPanel>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiPanel paddingSize="none" role="figure">
                <expressions.ReactExpressionRenderer
                  expression={expression}
                  debug={true}
                  onEvent={handleEvents}
                  renderError={(message: any) => {
                    return <div>{message}</div>;
                  }}
                />
              </EuiPanel>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPageSection>
      </EuiPageTemplate.Section>
    </EuiPageBody>
  );
}
