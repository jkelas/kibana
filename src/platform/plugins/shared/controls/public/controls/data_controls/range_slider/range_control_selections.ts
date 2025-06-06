/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { BehaviorSubject } from 'rxjs';
import { PublishingSubject } from '@kbn/presentation-publishing';
import { RangeValue, RangesliderControlState } from './types';

export function initializeRangeControlSelections(
  initialState: RangesliderControlState,
  onSelectionChange: () => void
) {
  const value$ = new BehaviorSubject<RangeValue | undefined>(initialState.value);
  const hasRangeSelection$ = new BehaviorSubject<boolean>(Boolean(value$.getValue()));

  function setValue(next: RangeValue | undefined) {
    if (value$.value !== next) {
      value$.next(next);
      hasRangeSelection$.next(Boolean(next));
      onSelectionChange();
    }
  }

  return {
    hasInitialSelections: initialState.value !== undefined,
    value$: value$ as PublishingSubject<RangeValue | undefined>,
    hasRangeSelection$: hasRangeSelection$ as PublishingSubject<boolean | undefined>,
    setValue,
  };
}
