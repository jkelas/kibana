/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { KibanaRequest, Logger } from '@kbn/core/server';
import type { ExceptionListClient } from '@kbn/lists-plugin/server';
import type { AlertingServerStart } from '@kbn/alerting-plugin/server';
import { createDetectionIndex } from '../../lib/detection_engine/routes/index/create_index_route';
import { createPrepackagedRules } from '../../lib/detection_engine/prebuilt_rules';
import type { SecuritySolutionApiRequestHandlerContext } from '../../types';

export interface InstallPrepackagedRulesProps {
  logger: Logger;
  context: SecuritySolutionApiRequestHandlerContext;
  request: KibanaRequest;
  alerts: AlertingServerStart;
  exceptionsClient: ExceptionListClient;
}

/**
 * As part of a user taking advantage of Endpoint Security from within fleet, we attempt to install
 * the pre-packaged rules from the detection engine, which includes an Endpoint Rule enabled by default
 */
export const installPrepackagedRules = async ({
  logger,
  context,
  request,
  alerts,
  exceptionsClient,
}: InstallPrepackagedRulesProps): Promise<void> => {
  // Create detection index & rules (if necessary). move past any failure, this is just a convenience
  try {
    await createDetectionIndex(context);
  } catch (err) {
    if (err.statusCode !== 409) {
      // 409 -> detection index already exists, which is fine
      logger.warn(
        `Possible problem creating detection signals index (${err.statusCode}): ${err.message}`
      );
    }
  }
  try {
    // this checks to make sure index exists first, safe to try in case of failure above
    // may be able to recover from minor errors
    const rulesClient = await alerts.getRulesClientWithRequest(request);
    await createPrepackagedRules(context, rulesClient, exceptionsClient);
  } catch (err) {
    logger.error(
      `Unable to create detection rules automatically (${err.statusCode}): ${err.message}`
    );
  }
};
