/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { RuleCustomizationCounts } from './types';

export interface ExternalRuleSourceInfo {
  is_customized: boolean;
  customized_fields: Array<{ fieldName: string }>;
}

const ALLOWED_FIELDS: Array<keyof RuleCustomizationCounts> = [
  'name',
  'description',
  'risk_score',
  'severity',
  'timeline_id',
  'note',
  'investigation_fields',
  'tags',
  'interval',
  'from',
  'setup',
  'query',
  'index',
  'data_view_id',
  'filters',
  'alert_suppression',
  'threshold',
  'threat_query',
  'anomaly_threshold',
  'new_terms_fields',
];

const getZeroedCounts = (): RuleCustomizationCounts => ({
  name: 0,
  description: 0,
  risk_score: 0,
  severity: 0,
  timeline_id: 0,
  note: 0,
  investigation_fields: 0,
  tags: 0,
  interval: 0,
  from: 0,
  setup: 0,
  query: 0,
  index: 0,
  data_view_id: 0,
  filters: 0,
  alert_suppression: 0,
  threshold: 0,
  threat_query: 0,
  anomaly_threshold: 0,
  new_terms_fields: 0,
});

export const getRuleCustomizationStatus = (
  ruleSources: ReadonlyArray<ExternalRuleSourceInfo>
): RuleCustomizationCounts => {
  const counts = getZeroedCounts();

  ruleSources.forEach((ruleSource) => {
    if (!ruleSource.is_customized) {
      return;
    }

    ruleSource.customized_fields.forEach((field) => {
      const fieldName = field.fieldName as keyof RuleCustomizationCounts;
      if ((ALLOWED_FIELDS as string[]).includes(fieldName as string)) {
        counts[fieldName] = (counts[fieldName] ?? 0) + 1;
      }
    });
  });

  return counts;
};
