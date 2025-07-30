/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { SavedObjectsClientContract, Logger } from '@kbn/core/server';
import type { PrebuiltRuleAsset } from '../../../lib/detection_engine/prebuilt_rules/model/rule_assets/prebuilt_rule_asset';
import type { RuleResponse } from '../../../../common/api/detection_engine/model/rule_schema/rule_schemas.gen';
import type { CalculateRuleDiffResult } from '../../../lib/detection_engine/prebuilt_rules/logic/diff/calculate_rule_diff';
import { calculateRuleDiff } from '../../../lib/detection_engine/prebuilt_rules/logic/diff/calculate_rule_diff';
import { createPrebuiltRuleAssetsClient } from '../../../lib/detection_engine/prebuilt_rules/logic/rule_assets/prebuilt_rule_assets_client';
import { ThreeWayDiffOutcome } from '../../../../common/api/detection_engine/prebuilt_rules/model/diff/three_way_diff/three_way_diff_outcome';
import type { RuleCustomizationStatus, TopLevelFieldsCustomizationMap } from './types';
import { getInitialRuleCustomizationStatus } from './get_initial_usage';

export interface GetCustomizedFieldsStatsOptions {
  savedObjectsClient: SavedObjectsClientContract;
  ruleResponsesForPrebuiltRules: RuleResponse[];
  logger: Logger;
}

export const getRuleCustomizationStatus = async ({
  savedObjectsClient,
  ruleResponsesForPrebuiltRules,
  logger,
}: GetCustomizedFieldsStatsOptions): Promise<RuleCustomizationStatus> => {
  try {
    const ruleAssetsClient = createPrebuiltRuleAssetsClient(savedObjectsClient);

    const prebuiltRuleVersions = ruleResponsesForPrebuiltRules.map((rule) => ({
      rule_id: rule.rule_id,
      version: rule.version,
    }));
    const prebuiltRuleAssets = await ruleAssetsClient.fetchAssetsByVersion(prebuiltRuleVersions);
    if (!prebuiltRuleAssets || !prebuiltRuleAssets.length) {
      logger.warn(
        'No prebuilt rule assets found for the provided rule responses. Returning empty stats.'
      );
      return getInitialRuleCustomizationStatus();
    }
    const ruleIdToRuleResponseMap = new Map<string, RuleResponse>(
      ruleResponsesForPrebuiltRules.map((ruleResponse) => [ruleResponse.rule_id, ruleResponse])
    );
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

    return getInitialRuleCustomizationStatus();
  }
};

async function calculateFieldsDiffsInBatches(
  prebuiltRuleAssets: PrebuiltRuleAsset[],
  ruleIdToRuleResponseMap: Map<string, RuleResponse>,
  logger: Logger
) {
  const BATCH_SIZE = 25;
  const diffResult: CalculateRuleDiffResult[] = [];
  let failuresCount = 0;

  for (let i = 0; i < prebuiltRuleAssets.length; i += BATCH_SIZE) {
    const batch = prebuiltRuleAssets.slice(i, i + BATCH_SIZE);
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

    const processed = Math.min(i + BATCH_SIZE, prebuiltRuleAssets.length);
    logger.debug(
      `Processed fields diffs of ${processed} out of ${
        prebuiltRuleAssets.length
      } rules (failed in this batch: ${batch.length - batchDiffResults.length})`
    );

    // Small delay between batches to prevent cluster overload
    if (processed < prebuiltRuleAssets.length) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
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

function calculateFieldsBreakdown(
  diffResult: CalculateRuleDiffResult[]
): TopLevelFieldsCustomizationMap {
  const result: TopLevelFieldsCustomizationMap = {
    author: 0,
    description: 0,
    exceptions_list: 0,
    false_positives: 0,
    filters: 0,
    from: 0,
    immutable: 0,
    index: 0,
    language: 0,
    license: 0,
    max_signals: 0,
    meta: 0,
    name: 0,
    query: 0,
    references: 0,
    related_integrations: 0,
    required_fields: 0,
    risk_score: 0,
    risk_score_mapping: 0,
    rule_id: 0,
    severity: 0,
    severity_mapping: 0,
    setup: 0,
    threat: 0,
    to: 0,
    type: 0,
    version: 0,
  };

  // Calculate the median number of customized fields per rule
  const customizedFieldsCounts = diffResult.map((diff) => {
    return Object.values(diff.ruleDiff?.fields ?? {}).filter(
      (fieldDiff) => fieldDiff.diff_outcome === ThreeWayDiffOutcome.CustomizedValueNoUpdate
    ).length;
  });

  let medianNumberOfCustomizedFields = 0;
  if (customizedFieldsCounts.length > 0) {
    const sortedCounts = customizedFieldsCounts.sort((a, b) => a - b);
    const mid = Math.floor(sortedCounts.length / 2);
    if (sortedCounts.length % 2 === 0) {
      medianNumberOfCustomizedFields = (sortedCounts[mid - 1] + sortedCounts[mid]) / 2;
    } else {
      medianNumberOfCustomizedFields = sortedCounts[mid];
    }
  }

  diffResult.forEach((diff) => {
    const fields = Object.entries(diff.ruleDiff?.fields ?? {}).filter(
      ([, fieldDiff]) => fieldDiff.diff_outcome === ThreeWayDiffOutcome.CustomizedValueNoUpdate
    );

    for (const [fieldName] of fields) {
      if (fieldName in result) {
        result[fieldName as keyof typeof result]++;
      }
    }
  });

  return result;
}
