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
  // TODO - total number of customized fields
  customized_fields_breakdown: {
    alert_suppression: {
      type: 'long',
      _meta: { description: 'Number of rules customizing alert_suppression' },
    },
    anomaly_threshold: {
      type: 'long',
      _meta: { description: 'Number of rules customizing anomaly_threshold' },
    },
    author: { type: 'long', _meta: { description: 'Number of rules customizing author' } },
    building_block: {
      type: 'long',
      _meta: { description: 'Number of rules customizing building_block' },
    },
    data_source: {
      type: 'long',
      _meta: { description: 'Number of rules customizing data_source' },
    },
    description: {
      type: 'long',
      _meta: { description: 'Number of rules customizing description' },
    },
    eql_query: {
      type: 'long',
      _meta: { description: 'Number of rules customizing eql_query' },
    },
    esql_query: {
      type: 'long',
      _meta: { description: 'Number of rules customizing esql_query' },
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
    history_window_start: {
      type: 'long',
      _meta: { description: 'Number of rules customizing history_window_start' },
    },
    immutable: { type: 'long', _meta: { description: 'Number of rules customizing immutable' } },
    index: { type: 'long', _meta: { description: 'Number of rules customizing index' } },
    investigation_fields: {
      type: 'long',
      _meta: { description: 'Number of rules customizing investigation_fields' },
    },
    kql_query: {
      type: 'long',
      _meta: { description: 'Number of rules customizing kql_query' },
    },
    language: { type: 'long', _meta: { description: 'Number of rules customizing language' } },
    license: { type: 'long', _meta: { description: 'Number of rules customizing license' } },
    machine_learning_job_id: {
      type: 'long',
      _meta: { description: 'Number of rules customizing machine_learning_job_id' },
    },
    max_signals: {
      type: 'long',
      _meta: { description: 'Number of rules customizing max_signals' },
    },
    meta: { type: 'long', _meta: { description: 'Number of rules customizing meta' } },
    name: { type: 'long', _meta: { description: 'Number of rules customizing name' } },
    new_terms_fields: {
      type: 'long',
      _meta: { description: 'Number of rules customizing new_terms_fields' },
    },
    note: { type: 'long', _meta: { description: 'Number of rules customizing note' } },
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
    rule_name_override: {
      type: 'long',
      _meta: { description: 'Number of rules customizing rule_name_override' },
    },
    rule_schedule: {
      type: 'long',
      _meta: { description: 'Number of rules customizing rule_schedule' },
    },
    severity: { type: 'long', _meta: { description: 'Number of rules customizing severity' } },
    severity_mapping: {
      type: 'long',
      _meta: { description: 'Number of rules customizing severity_mapping' },
    },
    setup: { type: 'long', _meta: { description: 'Number of rules customizing setup' } },
    tags: { type: 'long', _meta: { description: 'Number of rules customizing tags' } },
    threshold: { type: 'long', _meta: { description: 'Number of rules customizing threshold' } },
    threat: { type: 'long', _meta: { description: 'Number of rules customizing threat' } },
    threat_index: {
      type: 'long',
      _meta: { description: 'Number of rules customizing threat_index' },
    },
    threat_indicator_path: {
      type: 'long',
      _meta: { description: 'Number of rules customizing threat_indicator_path' },
    },
    threat_mapping: {
      type: 'long',
      _meta: { description: 'Number of rules customizing threat_mapping' },
    },
    threat_query: {
      type: 'long',
      _meta: { description: 'Number of rules customizing threat_query' },
    },
    timeline_template: {
      type: 'long',
      _meta: { description: 'Number of rules customizing timeline_template' },
    },
    timestamp_override: {
      type: 'long',
      _meta: { description: 'Number of rules customizing timestamp_override' },
    },
    to: { type: 'long', _meta: { description: 'Number of rules customizing to' } },
    type: { type: 'long', _meta: { description: 'Number of rules customizing type' } },
    version: { type: 'long', _meta: { description: 'Number of rules customizing version' } },
  },
};
