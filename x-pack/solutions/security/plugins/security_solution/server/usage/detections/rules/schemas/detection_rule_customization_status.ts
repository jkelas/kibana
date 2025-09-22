/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { MakeSchemaFrom } from '@kbn/usage-collection-plugin/server';
import type { RuleCustomizedFieldCount } from '../types';

export const ruleCustomizedFieldsCounts: MakeSchemaFrom<RuleCustomizedFieldCount> = {
  field_name: {
    type: 'keyword',
    _meta: { description: 'Name of the customized field' },
  },
  customized_count: {
    type: 'long',
    _meta: { description: 'Number of rules customizing this field' },
  },
};
