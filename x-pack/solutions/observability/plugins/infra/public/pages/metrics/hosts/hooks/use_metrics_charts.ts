/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import useAsync from 'react-use/lib/useAsync';
import type { LensBreakdownConfig } from '@kbn/lens-embeddable-utils/config_builder';
import { DataSchemaFormat } from '@kbn/metrics-data-access-plugin/common';
import { findInventoryModel } from '@kbn/metrics-data-access-plugin/common';
import { PAGE_SIZE_OPTIONS } from '../constants';

export const useMetricsCharts = ({
  dataViewId,
  schema,
}: {
  dataViewId?: string;
  schema?: DataSchemaFormat | null;
}) => {
  const { value: charts = [] } = useAsync(async () => {
    const model = findInventoryModel('host');
    const { cpu, disk, memory, network } = await model.metrics.getCharts({
      schema: schema ?? DataSchemaFormat.ECS,
    });

    return [
      cpu.xy.cpuUsage,
      cpu.xy.normalizedLoad1m,
      memory.xy.memoryUsage,
      memory.xy.memoryFree,
      disk.xy.diskSpaceAvailable,
      disk.xy.diskIORead,
      disk.xy.diskIOWrite,
      disk.xy.diskReadThroughput,
      disk.xy.diskWriteThroughput,
      network.xy.rx,
      network.xy.tx,
    ].map((chart) => ({
      ...chart,
      layers: chart.layers.map((layer) =>
        layer.type === 'series'
          ? {
              ...layer,
              breakdown: {
                type: 'topValues',
                field: 'host.name',
                size: PAGE_SIZE_OPTIONS.at(-1),
              } as LensBreakdownConfig,
            }
          : layer
      ),
      ...(dataViewId && {
        dataset: {
          index: dataViewId,
        },
      }),
    }));
  }, [schema, dataViewId]);

  return charts;
};
