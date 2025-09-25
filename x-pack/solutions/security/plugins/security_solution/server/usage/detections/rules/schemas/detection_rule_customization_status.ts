/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { MakeSchemaFrom } from '@kbn/usage-collection-plugin/server';
import type { RuleFieldsCustomizationMap } from '../types';

export const ruleFieldsCustomizationMap: MakeSchemaFrom<RuleFieldsCustomizationMap> = {
  name: { type: 'long' },
  description: { type: 'long' },
  risk_score: { type: 'long' },
  severity: { type: 'long' },
  timeline_id: { type: 'long' },
  note: { type: 'long' },
  investigation_fields: { type: 'long' },
  tags: { type: 'long' },
  interval: { type: 'long' },
  from: { type: 'long' },
  setup: { type: 'long' },
  query: { type: 'long' },
  index: { type: 'long' },
  data_view_id: { type: 'long' },
  filters: { type: 'long' },
  alert_suppression: { type: 'long' },
  threshold: { type: 'long' },
  threat_query: { type: 'long' },
  anomaly_threshold: { type: 'long' },
  new_terms_fields: { type: 'long' },
};
