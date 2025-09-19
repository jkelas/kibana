/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { RuleCustomizationStatus, CustomizedFieldCount } from './types';

export interface ExternalRuleSourceInfo {
  is_customized: boolean;
  customized_fields: Array<{ fieldName: string }>;
}

export const getRuleCustomizationStatus = (
  ruleResponses: ReadonlyArray<ExternalRuleSourceInfo>
): RuleCustomizationStatus => {
  const countsMap = new Map<string, number>();
  const perRuleCounts: number[] = [];

  for (const ruleSource of ruleResponses) {
    // eslint-disable-next-line no-continue
    if (!ruleSource.is_customized) continue;

    let ruleCustomizedFieldsCount = 0;
    for (const f of ruleSource.customized_fields) {
      const name = f.fieldName;
      countsMap.set(name, (countsMap.get(name) ?? 0) + 1);
      ruleCustomizedFieldsCount++;
    }
    if (ruleCustomizedFieldsCount > 0) perRuleCounts.push(ruleCustomizedFieldsCount);
  }

  const breakdown: CustomizedFieldCount[] = Array.from(
    countsMap,
    ([fieldName, customizedCount]) => ({
      field_name: fieldName,
      customized_count: customizedCount,
    })
  ).sort((a, b) => b.customized_count - a.customized_count);

  let median = 0;
  if (perRuleCounts.length) {
    perRuleCounts.sort((a, b) => a - b);
    const mid = Math.floor(perRuleCounts.length / 2);
    median =
      perRuleCounts.length % 2
        ? perRuleCounts[mid]
        : Math.floor((perRuleCounts[mid - 1] + perRuleCounts[mid]) / 2);
  }

  return { median_customized_fields_per_rule: median, customized_fields_breakdown: breakdown };
};
