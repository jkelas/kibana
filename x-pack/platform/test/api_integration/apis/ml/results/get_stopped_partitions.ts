/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import { Datafeed, Job } from '@kbn/ml-plugin/common/types/anomaly_detection_jobs';
import { FtrProviderContext } from '../../../ftr_provider_context';
import { USER } from '../../../services/ml/security_common';
import { getCommonRequestHeader } from '../../../services/ml/common_api';

export default ({ getService }: FtrProviderContext) => {
  const esArchiver = getService('esArchiver');
  const supertest = getService('supertestWithoutAuth');
  const ml = getService('ml');

  const testJobId = `sample_logs_${Date.now()}`;
  // non-aggregatable field to cause some partitions to change status to warn
  const PARTITION_FIELD_NAME = 'agent';

  interface TestConfig {
    testDescription: string;
    jobId: string;
    jobConfig: Job;
    datafeedConfig: Datafeed;
  }
  const setupTestConfigs = (
    jobId: string,
    stopOnWarn: boolean,
    enabledPerPartitionCat: boolean = true
  ): TestConfig => {
    const commonJobConfig = {
      groups: ['sample_logs', 'bootstrap', 'categorization'],
      description: "count by mlcategory (message) on 'sample logs' dataset with 15m bucket span",
      analysis_limits: { model_memory_limit: '26MB' },
      data_description: { time_field: '@timestamp', time_format: 'epoch_ms' },
      model_snapshot_retention_days: 10,
      daily_model_snapshot_retention_after_days: 1,
      allow_lazy_open: false,
    };
    // @ts-expect-error not full interface
    const datafeedConfig: Datafeed = {
      datafeed_id: `datafeed-${jobId}`,
      indices: ['ft_module_sample_logs'],
      job_id: jobId,
      query: { bool: { must: [{ match_all: {} }] } },
    };

    return {
      testDescription: `stop_on_warn is ${stopOnWarn}`,
      jobId,
      // @ts-expect-error not full interface
      jobConfig: {
        job_id: jobId,
        ...commonJobConfig,
        analysis_config: {
          bucket_span: '1m',
          categorization_field_name: 'message',
          per_partition_categorization: {
            enabled: enabledPerPartitionCat,
            stop_on_warn: stopOnWarn,
          },
          detectors: [
            {
              function: 'count',
              by_field_name: 'mlcategory',
              partition_field_name: PARTITION_FIELD_NAME,
            },
          ],
          influencers: ['mlcategory'],
        },
      },
      datafeedConfig,
    };
  };

  const testSetUps: TestConfig[] = [
    setupTestConfigs(`${testJobId}_t`, true),
    setupTestConfigs(`${testJobId}_f`, false),
    setupTestConfigs(`${testJobId}_viewer`, true),
    setupTestConfigs(`${testJobId}_unauthorized`, true),
  ];

  const testJobIds = testSetUps.map((t) => t.jobId);

  describe('get stopped_partitions', function () {
    before(async () => {
      await esArchiver.loadIfNeeded(
        'x-pack/platform/test/fixtures/es_archives/ml/module_sample_logs'
      );
      await ml.testResources.setKibanaTimeZoneToUTC();
      for (const testData of testSetUps) {
        const { jobConfig, datafeedConfig } = testData;
        await ml.api.createAndRunAnomalyDetectionLookbackJob(jobConfig, datafeedConfig);
      }
    });

    after(async () => {
      await ml.testResources.deleteDataViewByTitle('ft_module_sample_logs');
      await ml.api.cleanMlIndices();
    });

    it('should fetch all the stopped partitions correctly', async () => {
      const { jobId } = testSetUps[0];
      const { body, status } = await supertest
        .post(`/internal/ml/results/category_stopped_partitions`)
        .auth(USER.ML_POWERUSER, ml.securityCommon.getPasswordForUser(USER.ML_POWERUSER))
        .send({ jobIds: [jobId] })
        .set(getCommonRequestHeader('1'));
      ml.api.assertResponseStatusCode(200, status, body);

      expect(body.jobs).to.not.be(undefined);
      expect(body.jobs[jobId]).to.be.an('array');
      expect(body.jobs[jobId].length).to.be.greaterThan(0);
    });

    it('should not return jobId in response if stopped_on_warn is false', async () => {
      const { jobId } = testSetUps[1];
      const { body, status } = await supertest
        .post(`/internal/ml/results/category_stopped_partitions`)
        .auth(USER.ML_POWERUSER, ml.securityCommon.getPasswordForUser(USER.ML_POWERUSER))
        .send({ jobIds: [jobId] })
        .set(getCommonRequestHeader('1'));
      ml.api.assertResponseStatusCode(200, status, body);

      expect(body.jobs).to.not.be(undefined);
      expect(body.jobs).to.not.have.property(jobId);
    });

    it('should fetch stopped partitions for user with view permission', async () => {
      const { jobId } = testSetUps[2];
      const { body, status } = await supertest
        .post(`/internal/ml/results/category_stopped_partitions`)
        .auth(USER.ML_VIEWER, ml.securityCommon.getPasswordForUser(USER.ML_VIEWER))
        .send({ jobIds: [jobId] })
        .set(getCommonRequestHeader('1'));
      ml.api.assertResponseStatusCode(200, status, body);

      expect(body.jobs).to.not.be(undefined);
      expect(body.jobs[jobId]).to.be.an('array');
      expect(body.jobs[jobId].length).to.be.greaterThan(0);
    });

    it('should not fetch stopped partitions for unauthorized user', async () => {
      const { jobId } = testSetUps[3];

      const { body, status } = await supertest
        .post(`/internal/ml/results/category_stopped_partitions`)
        .auth(USER.ML_UNAUTHORIZED, ml.securityCommon.getPasswordForUser(USER.ML_UNAUTHORIZED))
        .send({ jobIds: [jobId] })
        .set(getCommonRequestHeader('1'));
      ml.api.assertResponseStatusCode(403, status, body);

      expect(body.error).to.be('Forbidden');
    });

    it('should fetch stopped partitions for multiple job ids', async () => {
      const { body, status } = await supertest
        .post(`/internal/ml/results/category_stopped_partitions`)
        .auth(USER.ML_POWERUSER, ml.securityCommon.getPasswordForUser(USER.ML_POWERUSER))
        .send({ jobIds: testJobIds })
        .set(getCommonRequestHeader('1'));
      ml.api.assertResponseStatusCode(200, status, body);

      expect(body.jobs).to.not.be(undefined);
      expect(body.jobs).to.not.have.property(testSetUps[1].jobId);

      Object.keys(body.jobs).forEach((currentJobId: string) => {
        expect(testJobIds).to.contain(currentJobId);
        expect(body.jobs[currentJobId]).to.be.an('array');
        expect(body.jobs[currentJobId].length).to.be.greaterThan(0);
      });
    });

    it('should return array of jobIds with stopped_partitions for multiple job ids when bucketed by job_id', async () => {
      const { body, status } = await supertest
        .post(`/internal/ml/results/category_stopped_partitions`)
        .auth(USER.ML_POWERUSER, ml.securityCommon.getPasswordForUser(USER.ML_POWERUSER))
        .send({ jobIds: testJobIds, fieldToBucket: 'job_id' })
        .set(getCommonRequestHeader('1'));
      ml.api.assertResponseStatusCode(200, status, body);

      expect(body.jobs).to.not.be(undefined);
      body.jobs.forEach((currentJobId: string) => {
        expect(testJobIds).to.contain(currentJobId);
      });
    });
  });
};
