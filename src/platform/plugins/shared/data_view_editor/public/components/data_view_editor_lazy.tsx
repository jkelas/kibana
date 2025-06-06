/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { lazy, Suspense } from 'react';
import { EuiLoadingSpinner, useEuiTheme } from '@elastic/eui';

import { DataViewEditorProps } from '../types';

const DataViewFlyoutContentContainer = lazy(() => import('./data_view_flyout_content_container'));

export const DataViewEditorLazy = (props: DataViewEditorProps) => {
  const { euiTheme } = useEuiTheme();

  return (
    <Suspense fallback={<EuiLoadingSpinner css={{ margin: euiTheme.size.m }} />}>
      <DataViewFlyoutContentContainer {...props} />
    </Suspense>
  );
};
