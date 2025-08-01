/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import {
  NetworkOverviewStrategyResponse,
  NetworkQueries,
} from '@kbn/security-solution-plugin/common/search_strategy';
import TestAgent from 'supertest/lib/agent';
import { SearchService } from '@kbn/ftr-common-functional-services';
import { FtrProviderContextWithSpaces } from '../../../../../ftr_provider_context_with_spaces';

export default function ({ getService }: FtrProviderContextWithSpaces) {
  const esArchiver = getService('esArchiver');
  const utils = getService('securitySolutionUtils');

  describe('Overview Network', () => {
    let supertest: TestAgent;
    let search: SearchService;
    describe('With filebeat', () => {
      before(async () => {
        supertest = await utils.createSuperTest();
        search = await utils.createSearch();
        await esArchiver.load('x-pack/platform/test/fixtures/es_archives/filebeat/default');
      });
      after(
        async () =>
          await esArchiver.unload('x-pack/platform/test/fixtures/es_archives/filebeat/default')
      );

      const FROM = '2000-01-01T00:00:00.000Z';
      const TO = '3000-01-01T00:00:00.000Z';

      const expectedResult = {
        auditbeatSocket: 0,
        filebeatCisco: 0,
        filebeatNetflow: 1273,
        filebeatPanw: 0,
        filebeatSuricata: 4547,
        filebeatZeek: 0,
        packetbeatDNS: 0,
        packetbeatFlow: 0,
        packetbeatTLS: 0,
      };

      it('Make sure that we get OverviewNetwork data', async () => {
        const { overviewNetwork } = await search.send<NetworkOverviewStrategyResponse>({
          supertest,
          options: {
            defaultIndex: ['filebeat-*'],
            factoryQueryType: NetworkQueries.overview,
            timerange: {
              interval: '12h',
              to: TO,
              from: FROM,
            },
            inspect: false,
          },
          strategy: 'securitySolutionSearchStrategy',
        });
        expect(overviewNetwork).to.eql(expectedResult);
      });
    });

    describe('With packetbeat', () => {
      before(async () => {
        supertest = await utils.createSuperTest();
        search = await utils.createSearch();
        await esArchiver.load('x-pack/test/functional/es_archives/packetbeat/overview');
      });
      after(
        async () =>
          await esArchiver.unload('x-pack/test/functional/es_archives/packetbeat/overview')
      );

      const FROM = '2000-01-01T00:00:00.000Z';
      const TO = '3000-01-01T00:00:00.000Z';
      const expectedResult = {
        auditbeatSocket: 0,
        filebeatCisco: 0,
        filebeatNetflow: 0,
        filebeatPanw: 0,
        filebeatSuricata: 0,
        filebeatZeek: 0,
        packetbeatDNS: 44,
        packetbeatFlow: 588,
        packetbeatTLS: 0,
      };

      it('Make sure that we get OverviewNetwork data', async () => {
        const { overviewNetwork } = await search.send<NetworkOverviewStrategyResponse>({
          supertest,
          options: {
            defaultIndex: ['packetbeat-*'],
            factoryQueryType: NetworkQueries.overview,
            timerange: {
              interval: '12h',
              to: TO,
              from: FROM,
            },
            inspect: false,
          },
          strategy: 'securitySolutionSearchStrategy',
        });
        expect(overviewNetwork).to.eql(expectedResult);
      });
    });

    describe('With auditbeat', () => {
      before(async () => {
        supertest = await utils.createSuperTest();
        search = await utils.createSearch();
        await esArchiver.load('x-pack/platform/test/fixtures/es_archives/auditbeat/overview');
      });
      after(
        async () =>
          await esArchiver.unload('x-pack/platform/test/fixtures/es_archives/auditbeat/overview')
      );

      const FROM = '2000-01-01T00:00:00.000Z';
      const TO = '3000-01-01T00:00:00.000Z';
      const expectedResult = {
        auditbeatSocket: 45,
        filebeatCisco: 0,
        filebeatNetflow: 0,
        filebeatPanw: 0,
        filebeatSuricata: 0,
        filebeatZeek: 0,
        packetbeatDNS: 0,
        packetbeatFlow: 0,
        packetbeatTLS: 0,
      };

      it('Make sure that we get OverviewNetwork data', async () => {
        const { overviewNetwork } = await search.send<NetworkOverviewStrategyResponse>({
          supertest,
          options: {
            defaultIndex: ['auditbeat-*'],
            factoryQueryType: NetworkQueries.overview,
            timerange: {
              interval: '12h',
              to: TO,
              from: FROM,
            },
            inspect: false,
          },
          strategy: 'securitySolutionSearchStrategy',
        });
        expect(overviewNetwork).to.eql(expectedResult);
      });
    });
  });
}
