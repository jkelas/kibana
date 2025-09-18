/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { RuleResponse } from '../../../../common/api/detection_engine/model/rule_schema/rule_schemas.gen';
import type { RuleCustomizationStatus, CustomizedFieldCount } from './types';

export const getRuleCustomizationStatus = (
  ruleResponses: RuleResponse[]
): RuleCustomizationStatus => {
  const countsMap: Map<string, number> = new Map();
  const perRuleCounts: number[] = [];

  ruleResponses.forEach((rule) => {
    const source = rule.rule_source;
    const customizedFields =
      source && source.type === 'external' ? source.customized_fields ?? [] : [];
    const isCustomized = source && source.type === 'external' && source.is_customized;
    if (!isCustomized) {
      return;
    }
    let ruleCustomizedFieldsCount = 0;
    for (const customizedField of customizedFields as Array<{ field_name?: string }>) {
      const fieldName = customizedField?.field_name;
      if (fieldName) {
        countsMap.set(fieldName, (countsMap.get(fieldName) ?? 0) + 1);
        ruleCustomizedFieldsCount += 1;
      }
    }
    if (ruleCustomizedFieldsCount > 0) {
      perRuleCounts.push(ruleCustomizedFieldsCount);
    }
  });

  const breakdown: CustomizedFieldCount[] = Array.from(countsMap.entries()).map(
    ([fieldName, customizedCount]) => ({
      field_name: fieldName,
      customized_count: customizedCount,
    })
  );
  breakdown.sort((a, b) => b.customized_count - a.customized_count);

  let median = 0;
  if (perRuleCounts.length > 0) {
    perRuleCounts.sort((a, b) => a - b);
    const mid = Math.floor(perRuleCounts.length / 2);
    median =
      perRuleCounts.length % 2 === 0
        ? Math.floor((perRuleCounts[mid - 1] + perRuleCounts[mid]) / 2)
        : perRuleCounts[mid];
  }

  return {
    median_customized_fields_per_rule: median,
    customized_fields_breakdown: breakdown,
  };
};
