/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { DETECTION_ENGINE_RULES_URL } from '@kbn/security-solution-plugin/common/constants';
import type SuperTest from 'supertest';
import { getCustomQueryRuleParams } from '../get_rule_params';

/**
 * Customizes a rule with the given parameters.
 * @param ruleId - The ID of the rule to customize
 * @param customizations - Custom parameters for the rule
 */
export async function customizeRule(
  supertest: SuperTest.Agent,
  ruleId: string,
  customizations: Record<string, any>
) {
  const customRuleParams = getCustomQueryRuleParams({
    rule_id: ruleId,
    ...customizations,
  });

  await supertest
    .put(`${DETECTION_ENGINE_RULES_URL}?rule_id=${ruleId}`)
    .set('kbn-xsrf', 'true')
    .send(customRuleParams)
    .expect(200);
}
