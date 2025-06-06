/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { RawValue } from '@kbn/data-plugin/common';

/**
 * Returns string key given an unknown raw color assignment value
 */
export function getValueKey(rawValue: RawValue): string {
  const key = String(rawValue);
  return key !== '[object Object]' ? key : JSON.stringify(rawValue);
}
