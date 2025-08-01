/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import apmClusterFixture from './fixtures/cluster.json';

export default function ({ getService }) {
  const supertest = getService('supertest');
  const esArchiver = getService('esArchiver');

  describe('overview', function () {
    // Archive contains non-cgroup data which collides with the in-cgroup APM server present by default on cloud deployments
    this.tags(['skipCloud']);

    const archive = 'x-pack/platform/test/fixtures/es_archives/monitoring/apm';
    const timeRange = {
      min: '2018-08-31T12:59:49.104Z',
      max: '2018-08-31T13:59:49.104Z',
    };

    before('load archive', () => {
      return esArchiver.load(archive);
    });

    after('unload archive', () => {
      return esArchiver.unload(archive);
    });

    it('should summarize apm cluster with metrics', async () => {
      const { body } = await supertest
        .post('/api/monitoring/v1/clusters/GUtE4UwgSR-XUICRDEFKkA/apm')
        .set('kbn-xsrf', 'xxx')
        .send({ timeRange })
        .expect(200);

      expect(body).to.eql(apmClusterFixture);
    });
  });
}
