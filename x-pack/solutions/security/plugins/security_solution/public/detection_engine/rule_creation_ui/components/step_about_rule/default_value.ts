/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { DEFAULT_MAX_SIGNALS } from '../../../../../common/constants';
import type { AboutStepRule } from '../../../common/types';
import { fillEmptySeverityMappings } from '../../../common/helpers';

export const threatDefault = [
  {
    framework: 'MITRE ATT&CK',
    tactic: { id: 'none', name: 'none', reference: 'none' },
    technique: [],
  },
];

export const stepAboutDefaultValue: AboutStepRule = {
  author: [],
  name: '',
  description: '',
  isAssociatedToEndpointList: false,
  isBuildingBlock: false,
  severity: {
    value: 'low',
    mapping: fillEmptySeverityMappings([]),
    isMappingChecked: false,
  },
  riskScore: { value: 21, mapping: [], isMappingChecked: false },
  references: [''],
  falsePositives: [''],
  investigationFields: [],
  license: '',
  ruleNameOverride: '',
  tags: [],
  timestampOverride: '',
  threat: threatDefault,
  note: '',
  maxSignals: DEFAULT_MAX_SIGNALS,
  setup: '',
};
