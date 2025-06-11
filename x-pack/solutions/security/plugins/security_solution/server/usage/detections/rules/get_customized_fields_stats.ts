/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { SavedObjectsClientContract, Logger } from '@kbn/core/server';
import type { PrebuiltRuleAsset } from '../../../lib/detection_engine/prebuilt_rules/model/rule_assets/prebuilt_rule_asset';
import type { RuleResponse } from '../../../../common/api/detection_engine/model/rule_schema/rule_schemas.gen';
// import { convertPrebuiltRuleAssetToRuleResponse } from '../../../lib/detection_engine/rule_management/logic/detection_rules_client/converters/convert_prebuilt_rule_asset_to_rule_response';
import type { CalculateRuleDiffResult } from '../../../lib/detection_engine/prebuilt_rules/logic/diff/calculate_rule_diff';
import { calculateRuleDiff } from '../../../lib/detection_engine/prebuilt_rules/logic/diff/calculate_rule_diff';
import { createPrebuiltRuleAssetsClient } from '../../../lib/detection_engine/prebuilt_rules/logic/rule_assets/prebuilt_rule_assets_client';
import type { RuleMetric } from './types';
import { ThreeWayDiffOutcome } from '../../../../common/api/detection_engine/prebuilt_rules/model/diff/three_way_diff/three_way_diff_outcome';

export interface CustomizedFieldsStats {
  rules_with_missing_base_version: number;
  customized_fields_breakdown: Array<{ field: string; count: number }>;
}

export interface GetCustomizedFieldsStatsOptions {
  savedObjectsClient: SavedObjectsClientContract;
  elasticRuleObjects: RuleMetric[];
  ruleIdToRuleResponseMap: Map<string, RuleResponse>;
  logger: Logger;
}

export const getCustomizedFieldsStatus = async ({
  savedObjectsClient,
  elasticRuleObjects,
  ruleIdToRuleResponseMap,
  logger,
}: GetCustomizedFieldsStatsOptions): Promise<CustomizedFieldsStats> => {
  try {
    const ruleAssetsClient = createPrebuiltRuleAssetsClient(savedObjectsClient);
    const prebuiltRuleVersions = elasticRuleObjects.map((rule) => ({
      rule_id: rule.rule_id,
      version: rule.rule_version,
    }));
    const prebuiltRuleAssets = await ruleAssetsClient.fetchAssetsByVersion(prebuiltRuleVersions);
    const diffResult = await calculateFieldsDiffsInBatches(
      prebuiltRuleAssets,
      ruleIdToRuleResponseMap,
      logger
    );

    return {
      rules_with_missing_base_version: ruleIdToRuleResponseMap.size - prebuiltRuleAssets.length,
      customized_fields_breakdown: calculateFieldsBreakdown(diffResult),
    };
  } catch (err) {
    logger.error(
      `Failed to get customized fields stats: ${err instanceof Error ? err.message : String(err)}`
    );

    return { rules_with_missing_base_version: 0, customized_fields_breakdown: [] };
  }
};

function calculateFieldsBreakdown(diffResult: CalculateRuleDiffResult[]) {
  const stats: Record<string, number> = {};
  diffResult.forEach((diff: CalculateRuleDiffResult) => {
    const fieldsDiff = diff.ruleDiff?.fields || {};
    Object.entries(fieldsDiff).forEach(([fieldName, fieldDiff]) => {
      if (fieldDiff.diff_outcome === ThreeWayDiffOutcome.CustomizedValueNoUpdate) {
        stats[fieldName] = (stats[fieldName] || 0) + 1;
      }
    });
  });

  return Object.entries(stats).map(([field, count]) => ({
    field,
    count,
  }));
}

async function calculateFieldsDiffsInBatches(
  prebuiltRuleAssets: PrebuiltRuleAsset[],
  ruleIdToRuleResponseMap: Map<string, RuleResponse>,
  logger: Logger
) {
  const diffResult: CalculateRuleDiffResult[] = [];
  const batchSize = 25;
  let failuresCount = 0;

  for (let i = 0; i < prebuiltRuleAssets.length; i += batchSize) {
    const batch = prebuiltRuleAssets.slice(i, i + batchSize);
    let batchDiffResults: CalculateRuleDiffResult[] = [];
    batchDiffResults = batch
      .map((asset) => {
        try {
          return calculateRuleDiff({
            current: ruleIdToRuleResponseMap.get(asset.rule_id),
            base: asset,
            target: asset,
          });
        } catch (err) {
          logger.error(
            `Failed to calculate rule diff for rule with rule_id: ${asset.rule_id}, version: ${
              asset.version
            }): ${err instanceof Error ? err.message : String(err)}`
          );
          failuresCount++;
          return null;
        }
      })
      .filter(Boolean) as CalculateRuleDiffResult[];

    diffResult.push(...batchDiffResults);

    const processed = Math.min(i + batchSize, prebuiltRuleAssets.length);
    logger.debug(
      `Processed fields diffs of ${processed} out of ${
        prebuiltRuleAssets.length
      } rules (failed in this batch: ${batch.length - batchDiffResults.length})`
    );

    // Small delay between batches to prevent cluster overload
    if (processed < prebuiltRuleAssets.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  logger.info(
    `Successfully calculated fields diffs for ${diffResult.length} out of ${prebuiltRuleAssets.length} rules.`
  );
  if (failuresCount > 0) {
    logger.warn(
      `Some rules failed to calculate fields diffs, check the logs for more details. Total failures: ${failuresCount}`
    );
  }

  return diffResult;
}
