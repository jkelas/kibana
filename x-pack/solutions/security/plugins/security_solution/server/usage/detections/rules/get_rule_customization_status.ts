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

  ruleResponses.forEach((rule) => {
    const source = rule.rule_source;
    const customizedFields =
      source && source.type === 'external' ? source.customized_fields ?? [] : [];
    const isCustomized = source && source.type === 'external' && source.is_customized;
    if (!isCustomized) {
      return;
    }
    for (const customizedField of customizedFields as Array<{ field_name?: string }>) {
      const fieldName = customizedField?.field_name;
      if (fieldName) {
        countsMap.set(fieldName, (countsMap.get(fieldName) ?? 0) + 1);
      }
    }
  });

  const breakdown: CustomizedFieldCount[] = Array.from(countsMap.entries()).map(
    ([fieldName, customizedCount]) => ({
      field_name: fieldName,
      customized_count: customizedCount,
    })
  );

  return {
    rules_with_missing_base_version: 0,
    customized_fields_breakdown: breakdown,
  };
};
