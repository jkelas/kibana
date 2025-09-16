/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { RuleResponse } from '../../../../common/api/detection_engine/model/rule_schema/rule_schemas.gen';
import type { RuleCustomizationStatus, TopLevelFieldsCustomizationMap } from './types';
import { getInitialRuleCustomizationStatus } from './get_initial_usage';

export const getRuleCustomizationStatus = (
  ruleResponses: RuleResponse[]
): RuleCustomizationStatus => {
  const initial = getInitialRuleCustomizationStatus();
  const breakdown: TopLevelFieldsCustomizationMap = { ...initial.customized_fields_breakdown };

  for (const rule of ruleResponses) {
    const source = rule.rule_source;
    const customizedFields =
      source && source.type === 'external' ? source.customized_fields ?? [] : [];
    const isCustomized = source && source.type === 'external' && source.is_customized;
    if (!isCustomized) {
      // eslint-disable-next-line no-continue
      continue;
    }
    for (const customizedField of customizedFields as Array<{ field_name?: string }>) {
      const fieldName = customizedField?.field_name;
      if (fieldName && fieldName in breakdown) {
        const key = fieldName as keyof TopLevelFieldsCustomizationMap;
        breakdown[key] = (breakdown[key] ?? 0) + 1;
      }
    }
  }

  return {
    rules_with_missing_base_version: 0,
    customized_fields_breakdown: breakdown,
  };
};
