/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { MakeSchemaFrom } from '@kbn/usage-collection-plugin/server';
import type { RuleCustomizationCounts } from '../types';

export const ruleCustomizedFieldsCounts: MakeSchemaFrom<RuleCustomizationCounts> = {
  alert_suppression: { type: 'long' },
  anomaly_threshold: { type: 'long' },
  data_view_id: { type: 'long' },
  description: { type: 'long' },
  filters: { type: 'long' },
  from: { type: 'long' },
  index: { type: 'long' },
  interval: { type: 'long' },
  investigation_fields: { type: 'long' },
  name: { type: 'long' },
  new_terms_fields: { type: 'long' },
  note: { type: 'long' },
  query: { type: 'long' },
  risk_score: { type: 'long' },
  severity: { type: 'long' },
  setup: { type: 'long' },
  tags: { type: 'long' },
  threat_query: { type: 'long' },
  threshold: { type: 'long' },
  timeline_id: { type: 'long' },
};
