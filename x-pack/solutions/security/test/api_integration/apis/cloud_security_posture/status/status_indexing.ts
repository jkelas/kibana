/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import expect from '@kbn/expect';
import { ELASTIC_HTTP_VERSION_HEADER } from '@kbn/core-http-common';
import type { CspSetupStatus } from '@kbn/cloud-security-posture-common';
import {
  FINDINGS_INDEX_DEFAULT_NS,
  VULNERABILITIES_INDEX_DEFAULT_NS,
} from '@kbn/cloud-security-posture-plugin/common/constants';
import { FtrProviderContext } from '../../../ftr_provider_context';
import { EsIndexDataProvider } from '../../../../cloud_security_posture_api/utils';
import { createPackagePolicy } from '../helper';
import { findingsMockData, vulnerabilityMockData } from '../mock_data';

export default function (providerContext: FtrProviderContext) {
  const { getService } = providerContext;
  const supertest = getService('supertest');
  const es = getService('es');
  const esArchiver = getService('esArchiver');
  const kibanaServer = getService('kibanaServer');
  const findingsIndex = new EsIndexDataProvider(es, FINDINGS_INDEX_DEFAULT_NS);
  const vulnerabilitiesIndex = new EsIndexDataProvider(es, VULNERABILITIES_INDEX_DEFAULT_NS);

  describe('GET /internal/cloud_security_posture/status', () => {
    let agentPolicyId: string;

    describe('STATUS = INDEXING TEST', () => {
      beforeEach(async () => {
        await kibanaServer.savedObjects.cleanStandardList();
        await esArchiver.load('x-pack/platform/test/fixtures/es_archives/fleet/empty_fleet_server');

        const { body: agentPolicyResponse } = await supertest
          .post(`/api/fleet/agent_policies`)
          .set(ELASTIC_HTTP_VERSION_HEADER, '2023-10-31')
          .set('kbn-xsrf', 'xxxx')
          .send({
            name: 'Test policy',
            namespace: 'default',
          });

        agentPolicyId = agentPolicyResponse.item.id;
        await findingsIndex.deleteAll();
        await vulnerabilitiesIndex.deleteAll();
      });

      afterEach(async () => {
        await findingsIndex.deleteAll();
        await vulnerabilitiesIndex.deleteAll();
        await kibanaServer.savedObjects.cleanStandardList();
        await esArchiver.unload(
          'x-pack/platform/test/fixtures/es_archives/fleet/empty_fleet_server'
        );
      });

      it(`Return kspm status indexing when security_solution-cloud_security_posture.misconfiguration_latest doesn't contain new kspm documents, but has newly connected agents`, async () => {
        await createPackagePolicy(
          supertest,
          agentPolicyId,
          'kspm',
          'cloudbeat/cis_k8s',
          'vanilla',
          'kspm'
        );

        await findingsIndex.addBulk(findingsMockData);

        const { body: res }: { body: CspSetupStatus } = await supertest
          .get(`/internal/cloud_security_posture/status`)
          .set(ELASTIC_HTTP_VERSION_HEADER, '1')
          .set('kbn-xsrf', 'xxxx')
          .expect(200);

        expect(res.kspm.status).to.eql(
          'indexing',
          `expected kspm status to be indexing but got ${res.kspm.status} instead`
        );
      });

      it(`Return cspm status indexing when security_solution-cloud_security_posture.misconfiguration_latest doesn't contain new cspm documents, but has newly connected agents  `, async () => {
        await createPackagePolicy(
          supertest,
          agentPolicyId,
          'cspm',
          'cloudbeat/cis_aws',
          'aws',
          'cspm'
        );

        await findingsIndex.addBulk(findingsMockData);

        const { body: res }: { body: CspSetupStatus } = await supertest
          .get(`/internal/cloud_security_posture/status`)
          .set(ELASTIC_HTTP_VERSION_HEADER, '1')
          .set('kbn-xsrf', 'xxxx')
          .expect(200);

        expect(res.cspm.status).to.eql(
          'indexing',
          `expected cspm status to be indexing but got ${res.cspm.status} instead`
        );
      });

      it(`Return vuln status indexing when logs-cloud_security_posture.vulnerabilities_latest-default doesn't contain vuln new documents, but has newly connected agents`, async () => {
        await createPackagePolicy(
          supertest,
          agentPolicyId,
          'vuln_mgmt',
          'cloudbeat/vuln_mgmt_aws',
          'aws',
          'vuln_mgmt'
        );

        await vulnerabilitiesIndex.addBulk(vulnerabilityMockData);

        const { body: res }: { body: CspSetupStatus } = await supertest
          .get(`/internal/cloud_security_posture/status`)
          .set(ELASTIC_HTTP_VERSION_HEADER, '1')
          .set('kbn-xsrf', 'xxxx')
          .expect(200);

        expect(res.vuln_mgmt.status).to.eql(
          'indexing',
          `expected vuln_mgmt status to be indexing but got ${res.vuln_mgmt.status} instead`
        );
      });
    });
  });
}
