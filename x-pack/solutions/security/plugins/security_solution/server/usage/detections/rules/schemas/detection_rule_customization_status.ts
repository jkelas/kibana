/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { MakeSchemaFrom } from '@kbn/usage-collection-plugin/server';
import type { RuleCustomizationStatus } from '../types';

export const ruleCustomizationStatusSchema: MakeSchemaFrom<RuleCustomizationStatus> = {
  rules_with_missing_base_version: {
    type: 'long',
    _meta: { description: 'Number of rules with missing base version' },
  },
  customized_fields_breakdown: {
    type: 'array',
    items: {
      field_name: {
        type: 'keyword',
        _meta: { description: 'Name of the customized field' },
      },
      customized_count: {
        type: 'long',
        _meta: { description: 'Number of rules customizing this field' },
      },
    },
  },
};
