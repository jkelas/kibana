/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from 'expect';
import deepmerge from 'deepmerge';
import ossRootTelemetrySchema from '@kbn/telemetry-plugin/schema/oss_root.json';
import xpackRootTelemetrySchema from '@kbn/telemetry-collection-xpack-plugin/schema/xpack_root.json';
import ossPluginsTelemetrySchema from '@kbn/telemetry-plugin/schema/oss_plugins.json';
import ossPackagesTelemetrySchema from '@kbn/telemetry-plugin/schema/kbn_packages.json';
import ossPlatformTelemetrySchema from '@kbn/telemetry-plugin/schema/oss_platform.json';
import xpackPluginsTelemetrySchema from '@kbn/telemetry-collection-xpack-plugin/schema/xpack_plugins.json';
import xpackPlatformTelemetrySchema from '@kbn/telemetry-collection-xpack-plugin/schema/xpack_platform.json';
// BOOKMARK - List of Kibana Solutions
import xpackObservabilityTelemetrySchema from '@kbn/telemetry-collection-xpack-plugin/schema/xpack_observability.json';
import xpackSearchTelemetrySchema from '@kbn/telemetry-collection-xpack-plugin/schema/xpack_search.json';
import xpackSecurityTelemetrySchema from '@kbn/telemetry-collection-xpack-plugin/schema/xpack_security.json';
import xpackChatTelemetrySchema from '@kbn/telemetry-collection-xpack-plugin/schema/xpack_chat.json';
import { assertTelemetryPayload } from '@kbn/telemetry-tools';
import type { TelemetrySchemaObject } from '@kbn/telemetry-tools/src/schema_ftr_validations/schema_to_config_schema';
import type { UsageStatsPayloadTestFriendly } from '../../../../api_integration/services/usage_api';
import type { RoleCredentials } from '../../../shared/services';
import { FtrProviderContext } from '../../ftr_provider_context';

export default function ({ getService }: FtrProviderContext) {
  const usageApi = getService('usageAPI');
  const svlCommonApi = getService('svlCommonApi');
  const supertestWithoutAuth = getService('supertestWithoutAuth');
  const svlUserManager = getService('svlUserManager');

  describe('Snapshot telemetry', function () {
    let stats: UsageStatsPayloadTestFriendly;
    let roleAuthc: RoleCredentials;

    before(async () => {
      roleAuthc = await svlUserManager.createM2mApiKeyWithRoleScope('admin');
      const [unencryptedPayload] = await usageApi.getTelemetryStats(
        { unencrypted: true },
        { authHeader: roleAuthc.apiKeyHeader }
      );
      stats = unencryptedPayload.stats;
    });

    after(async () => {
      await svlUserManager.invalidateM2mApiKeyWithRoleScope(roleAuthc);
    });

    it('should pass the schema validation (ensures BWC with Classic offering)', () => {
      const root = deepmerge(ossRootTelemetrySchema, xpackRootTelemetrySchema);
      const schemas = [
        ossPluginsTelemetrySchema,
        ossPackagesTelemetrySchema,
        ossPlatformTelemetrySchema,
        xpackPluginsTelemetrySchema,
        xpackPlatformTelemetrySchema,
        xpackObservabilityTelemetrySchema,
        xpackSearchTelemetrySchema,
        xpackSecurityTelemetrySchema,
        xpackChatTelemetrySchema,
      ] as TelemetrySchemaObject[];

      const plugins = schemas.reduce((acc, schema) => deepmerge(acc, schema));

      try {
        assertTelemetryPayload({ root, plugins }, stats);
      } catch (err) {
        err.message = `The telemetry schemas in are out-of-date. Please define the schema of your collector and run "node scripts/telemetry_check --fix" to update them: ${err.message}`;
        throw err;
      }
    });

    it('includes the project type info in the body', async () => {
      expect(stats.stack_stats.kibana?.plugins?.telemetry?.labels?.serverless).toMatch(
        /security|observability|search/
      );

      const { body } = await supertestWithoutAuth
        .get('/api/telemetry/v2/config')
        .set(svlCommonApi.getCommonRequestHeader())
        .set(roleAuthc.apiKeyHeader)
        .expect(200);

      expect(stats.stack_stats.kibana?.plugins?.telemetry?.labels?.serverless).toBe(
        body.labels.serverless
      );
    });
  });
}
