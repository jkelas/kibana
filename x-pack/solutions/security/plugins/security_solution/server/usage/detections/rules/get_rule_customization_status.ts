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
  'alert_suppression',
  'anomaly_threshold',
  'data_view_id',
  'description',
  'filters',
  'from',
  'index',
  'interval',
  'investigation_fields',
  'name',
  'new_terms_fields',
  'note',
  'query',
  'risk_score',
  'severity',
  'setup',
  'tags',
  'threat_query',
  'threshold',
  'timeline_id',
];

const getZeroedCounts = (): RuleCustomizationCounts => ({
  alert_suppression: 0,
  anomaly_threshold: 0,
  data_view_id: 0,
  description: 0,
  filters: 0,
  from: 0,
  index: 0,
  interval: 0,
  investigation_fields: 0,
  name: 0,
  new_terms_fields: 0,
  note: 0,
  query: 0,
  risk_score: 0,
  severity: 0,
  setup: 0,
  tags: 0,
  threat_query: 0,
  threshold: 0,
  timeline_id: 0,
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
