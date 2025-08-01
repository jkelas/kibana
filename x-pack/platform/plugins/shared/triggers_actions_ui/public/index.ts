/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

// TODO: https://github.com/elastic/kibana/issues/110895

import type { PluginInitializerContext } from '@kbn/core/server';
import { Plugin } from './plugin';

export type {
  Rule,
  RuleAction,
  RuleType,
  RuleTypeIndex,
  RuleTypeModel,
  RuleStatusFilterProps,
  RuleStatus,
  RuleTableItem,
  ActionType,
  ActionTypeRegistryContract,
  RuleTypeRegistryContract,
  RuleTypeParamsExpressionProps,
  ValidationResult,
  ActionVariables,
  ActionConnector,
  IErrorObject,
  RuleFlyoutCloseReason,
  RuleTypeParams,
  AsApiContract,
  RuleSummary,
  AlertStatus,
  RuleEventLogListProps,
  RuleDefinitionProps,
  RulesListVisibleColumns,
  AlertSummaryTimeRange,
  NotifyWhenSelectOptions,
  RuleCreationValidConsumer,
} from './types';

export type {
  ActionConnectorFieldsProps,
  ActionParamsProps,
  ActionTypeModel,
  GenericValidationResult,
} from './types';

export {
  AlertHistoryDefaultIndexName,
  ALERT_HISTORY_PREFIX,
  AlertHistoryDocumentTemplate,
  AlertHistoryEsIndexConnectorId,
  ActionConnectorMode,
} from './types';

export { useConnectorContext } from './application/context/use_connector_context';

export {
  ActionForm,
  CreateConnectorFlyout,
  EditConnectorFlyout,
} from './application/sections/action_connector_form';

export type { ConnectorFormSchema } from './application/sections/action_connector_form';

export type { ConfigFieldSchema, SecretsFieldSchema } from './application/components';

export {
  JsonEditorWithMessageVariables,
  JsonFieldWrapper,
  MustacheTextFieldWrapper,
  SimpleConnectorForm,
  TextAreaWithMessageVariables,
  TextFieldWithMessageVariables,
  SectionLoading,
} from './application/components';

export { AlertProvidedActionVariables } from '@kbn/alerts-ui-shared';
export { templateActionVariable, updateActionConnector, executeAction } from './application/lib';

export function plugin(context: PluginInitializerContext) {
  return new Plugin(context);
}

export { useKibana } from './common';
export type { AggregationType, ValidNormalizedTypes } from './common';

export {
  WhenExpression,
  OfExpression,
  ForLastExpression,
  ThresholdExpression,
  ValueExpression,
  builtInComparators,
  builtInGroupByTypes,
  builtInAggregationTypes,
  getFields,
  getIndexOptions,
  firstFieldOption,
  getTimeFieldOptions,
  getTimeOptions,
  GroupByExpression,
  connectorDeprecatedMessage,
  deprecatedMessage,
} from './common';

export { useSubAction } from './application/hooks';

export type {
  TriggersAndActionsUIPublicPluginSetup,
  TriggersAndActionsUIPublicPluginStart,
} from './plugin';
export { Plugin } from './plugin';

export { loadRuleAggregations } from './application/lib/rule_api/aggregate';
export { TIME_UNITS } from './application/constants';
export { getTimeUnitLabel } from './common/lib/get_time_unit_label';
export type { TriggersAndActionsUiServices } from './application/rules_app';
export type { BulkOperationAttributes, BulkOperationResponse } from './types';

export { transformRule } from './application/lib/rule_api/common_transformations';

export { validateActionFilterQuery } from './application/lib/value_validators';
