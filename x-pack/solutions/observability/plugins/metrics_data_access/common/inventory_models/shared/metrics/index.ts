/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { nginxRequestRate } from './tsvb/nginx_request_rate';
import { nginxActiveConnections } from './tsvb/nginx_active_connections';
import { nginxHits } from './tsvb/nginx_hits';
import { nginxRequestsPerConnection } from './tsvb/nginx_requests_per_connection';
import { awsCpuUtilization } from './tsvb/aws_cpu_utilization';
import { awsDiskioBytes } from './tsvb/aws_diskio_bytes';
import { awsDiskioOps } from './tsvb/aws_diskio_ops';
import { awsNetworkBytes } from './tsvb/aws_network_bytes';
import { awsNetworkPackets } from './tsvb/aws_network_packets';
import { awsOverview } from './tsvb/aws_overview';
import type { InventoryMetricsConfig } from './types';

export const sharedMetrics: Pick<InventoryMetricsConfig, 'tsvb'> = {
  tsvb: {
    nginxActiveConnections,
    nginxHits,
    nginxRequestRate,
    nginxRequestsPerConnection,
    awsCpuUtilization,
    awsDiskioBytes,
    awsDiskioOps,
    awsNetworkBytes,
    awsNetworkPackets,
    awsOverview,
  },
};
