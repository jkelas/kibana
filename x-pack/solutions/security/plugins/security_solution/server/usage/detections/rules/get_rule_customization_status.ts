/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { RuleCustomizedFieldCount } from './types';

export interface ExternalRuleSourceInfo {
  is_customized: boolean;
  customized_fields: Array<{ fieldName: string }>;
}

export const getRuleCustomizationStatus = (
  ruleSources: ReadonlyArray<ExternalRuleSourceInfo>
): RuleCustomizedFieldCount[] => {
  const countsMap = new Map<string, number>();

  ruleSources.forEach((ruleSource) => {
    if (!ruleSource.is_customized) {
      return;
    }

    let customizedCount = 0;
    ruleSource.customized_fields.forEach((field) => {
      const fieldName = field.fieldName;
      countsMap.set(fieldName, (countsMap.get(fieldName) ?? 0) + 1);
      customizedCount++;
    });
  });

  const breakdown: RuleCustomizedFieldCount[] = Array.from(
    countsMap,
    ([fieldName, customizedCount]) => ({
      field_name: fieldName,
      customized_count: customizedCount,
    })
  );

  return breakdown;
};
