/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { toNumberRt } from '@kbn/io-ts-utils';
import type { BaseFlameGraph, TopNFunctions } from '@kbn/profiling-utils';
import * as t from 'io-ts';
import { CONTAINER_ID, HOST_NAME } from '../../../../common/es_fields/apm';
import { mergeKueries, toKueryFilterFormat } from '../../../../common/utils/kuery_utils';
import { getApmEventClient } from '../../../lib/helpers/get_apm_event_client';
import { createApmServerRoute } from '../../apm_routes/create_apm_server_route';
import {
  environmentRt,
  kueryRt,
  rangeRt,
  serviceTransactionDataSourceRt,
} from '../../default_api_types';
import { fetchFlamegraph } from '../fetch_flamegraph';
import { fetchFunctions } from '../fetch_functions';
import { getServiceCorrelationFields } from '../get_service_correlation_fields';

const profilingHostsFlamegraphRoute = createApmServerRoute({
  endpoint: 'GET /internal/apm/services/{serviceName}/profiling/hosts/flamegraph',
  params: t.type({
    path: t.type({ serviceName: t.string }),
    query: t.intersection([rangeRt, environmentRt, serviceTransactionDataSourceRt, kueryRt]),
  }),
  security: { authz: { requiredPrivileges: ['apm'] } },
  handler: async (
    resources
  ): Promise<
    { flamegraph: BaseFlameGraph; hostNames: string[]; containerIds: string[] } | undefined
  > => {
    const { context, plugins, params } = resources;
    const core = await context.core;
    const [esClient, apmEventClient, profilingDataAccessStart] = await Promise.all([
      core.elasticsearch.client,
      await getApmEventClient(resources),
      await plugins.profilingDataAccess?.start(),
    ]);
    if (profilingDataAccessStart) {
      const { start, end, environment, documentType, rollupInterval, kuery } = params.query;
      const { serviceName } = params.path;

      const { hostNames, containerIds } = await getServiceCorrelationFields({
        apmEventClient,
        start,
        end,
        environment,
        serviceName,
        documentType,
        rollupInterval,
      });

      if (!hostNames.length && !containerIds.length) {
        return undefined;
      }
      const startSecs = start / 1000;
      const endSecs = end / 1000;

      const flamegraph = await fetchFlamegraph({
        profilingDataAccessStart,
        core,
        esClient: esClient.asCurrentUser,
        start: startSecs,
        end: endSecs,
        kuery:
          containerIds.length > 0
            ? mergeKueries([`(${toKueryFilterFormat(CONTAINER_ID, containerIds)})`, kuery])
            : mergeKueries([`(${toKueryFilterFormat(HOST_NAME, hostNames)})`, kuery]),
      });

      return { flamegraph, hostNames, containerIds };
    }

    return undefined;
  },
});

const profilingHostsFunctionsRoute = createApmServerRoute({
  endpoint: 'GET /internal/apm/services/{serviceName}/profiling/hosts/functions',
  params: t.type({
    path: t.type({ serviceName: t.string }),
    query: t.intersection([
      rangeRt,
      environmentRt,
      serviceTransactionDataSourceRt,
      t.type({ startIndex: toNumberRt, endIndex: toNumberRt }),
      kueryRt,
    ]),
  }),
  security: { authz: { requiredPrivileges: ['apm'] } },
  handler: async (
    resources
  ): Promise<
    { functions: TopNFunctions; hostNames: string[]; containerIds: string[] } | undefined
  > => {
    const { context, plugins, params } = resources;
    const core = await context.core;
    const [esClient, apmEventClient, profilingDataAccessStart] = await Promise.all([
      core.elasticsearch.client,
      await getApmEventClient(resources),
      await plugins.profilingDataAccess?.start(),
    ]);
    if (profilingDataAccessStart) {
      const { start, end, environment, startIndex, endIndex, documentType, rollupInterval, kuery } =
        params.query;
      const { serviceName } = params.path;

      const { hostNames, containerIds } = await getServiceCorrelationFields({
        apmEventClient,
        start,
        end,
        environment,
        serviceName,
        documentType,
        rollupInterval,
      });

      if (!hostNames.length && !containerIds.length) {
        return undefined;
      }

      const startSecs = start / 1000;
      const endSecs = end / 1000;

      const functions = await fetchFunctions({
        profilingDataAccessStart,
        core,
        esClient: esClient.asCurrentUser,
        startIndex,
        endIndex,
        start: startSecs,
        end: endSecs,
        kuery:
          containerIds.length > 0
            ? mergeKueries([`(${toKueryFilterFormat(CONTAINER_ID, containerIds)})`, kuery])
            : mergeKueries([`(${toKueryFilterFormat(HOST_NAME, hostNames)})`, kuery]),
      });

      return { functions, hostNames, containerIds };
    }

    return undefined;
  },
});

export const profilingHostsRouteRepository = {
  ...profilingHostsFlamegraphRoute,
  ...profilingHostsFunctionsRoute,
};
