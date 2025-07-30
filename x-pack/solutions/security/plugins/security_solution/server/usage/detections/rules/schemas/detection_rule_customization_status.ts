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
    author: { type: 'long', _meta: { description: 'Number of rules customizing author' } },
    description: {
      type: 'long',
      _meta: { description: 'Number of rules customizing description' },
    },
    exceptions_list: {
      type: 'long',
      _meta: { description: 'Number of rules customizing exceptions_list' },
    },
    false_positives: {
      type: 'long',
      _meta: { description: 'Number of rules customizing false_positives' },
    },
    filters: { type: 'long', _meta: { description: 'Number of rules customizing filters' } },
    from: { type: 'long', _meta: { description: 'Number of rules customizing from' } },
    immutable: { type: 'long', _meta: { description: 'Number of rules customizing immutable' } },
    index: { type: 'long', _meta: { description: 'Number of rules customizing index' } },
    language: { type: 'long', _meta: { description: 'Number of rules customizing language' } },
    license: { type: 'long', _meta: { description: 'Number of rules customizing license' } },
    max_signals: {
      type: 'long',
      _meta: { description: 'Number of rules customizing max_signals' },
    },
    meta: { type: 'long', _meta: { description: 'Number of rules customizing meta' } },
    name: { type: 'long', _meta: { description: 'Number of rules customizing name' } },
    query: { type: 'long', _meta: { description: 'Number of rules customizing query' } },
    references: { type: 'long', _meta: { description: 'Number of rules customizing references' } },
    related_integrations: {
      type: 'long',
      _meta: { description: 'Number of rules customizing related_integrations' },
    },
    required_fields: {
      type: 'long',
      _meta: { description: 'Number of rules customizing required_fields' },
    },
    risk_score: { type: 'long', _meta: { description: 'Number of rules customizing risk_score' } },
    risk_score_mapping: {
      type: 'long',
      _meta: { description: 'Number of rules customizing risk_score_mapping' },
    },
    rule_id: { type: 'long', _meta: { description: 'Number of rules customizing rule_id' } },
    severity: { type: 'long', _meta: { description: 'Number of rules customizing severity' } },
    severity_mapping: {
      type: 'long',
      _meta: { description: 'Number of rules customizing severity_mapping' },
    },
    setup: { type: 'long', _meta: { description: 'Number of rules customizing setup' } },
    threat: { type: 'long', _meta: { description: 'Number of rules customizing threat' } },
    to: { type: 'long', _meta: { description: 'Number of rules customizing to' } },
    type: { type: 'long', _meta: { description: 'Number of rules customizing type' } },
    version: { type: 'long', _meta: { description: 'Number of rules customizing version' } },
  },
};
