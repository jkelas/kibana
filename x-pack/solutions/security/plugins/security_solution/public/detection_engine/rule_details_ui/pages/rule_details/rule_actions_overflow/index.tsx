/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiButtonIcon,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiPopover,
  EuiToolTip,
} from '@elastic/eui';
import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { useRuleCustomizationsContext } from '../../../../rule_management/components/rule_details/rule_customizations_diff/rule_customizations_context';
import { isCustomizedPrebuiltRule } from '../../../../../../common/api/detection_engine';
import { useScheduleRuleRun } from '../../../../rule_gaps/logic/use_schedule_rule_run';
import type { TimeRange } from '../../../../rule_gaps/types';
import { APP_UI_ID, SecurityPageName } from '../../../../../../common';
import { DuplicateOptions } from '../../../../../../common/detection_engine/rule_management/constants';
import { BulkActionTypeEnum } from '../../../../../../common/api/detection_engine/rule_management';
import { getRulesUrl } from '../../../../../common/components/link_to/redirect_to_detection_engine';
import { useBoolState } from '../../../../../common/hooks/use_bool_state';
import { SINGLE_RULE_ACTIONS } from '../../../../../common/lib/apm/user_actions';
import { useStartTransaction } from '../../../../../common/lib/apm/use_start_transaction';
import { useKibana } from '../../../../../common/lib/kibana';
import { canEditRuleWithActions } from '../../../../../common/utils/privileges';
import type { Rule } from '../../../../rule_management/logic';
import { useBulkExport } from '../../../../rule_management/logic/bulk_actions/use_bulk_export';
import {
  goToRuleEditPage,
  useExecuteBulkAction,
} from '../../../../rule_management/logic/bulk_actions/use_execute_bulk_action';
import { useDownloadExportedRules } from '../../../../rule_management/logic/bulk_actions/use_download_exported_rules';
import * as i18nActions from '../../../../common/translations';
import * as i18n from './translations';
import { ManualRuleRunEventTypes } from '../../../../../common/lib/telemetry';

const MyEuiButtonIcon = styled(EuiButtonIcon)`
  &.euiButtonIcon {
    svg {
      transform: rotate(90deg);
    }

    border: 1px solid ${({ theme }) => theme.euiColorPrimary};
    width: 40px;
    height: 40px;
  }
`;

interface RuleActionsOverflowComponentProps {
  rule: Rule | null;
  userHasPermissions: boolean;
  canDuplicateRuleWithActions: boolean;
  showBulkDuplicateExceptionsConfirmation: () => Promise<string | null>;
  showManualRuleRunConfirmation: () => Promise<TimeRange | null>;
  confirmDeletion: () => Promise<boolean>;
}

/**
 * Overflow Actions for a Rule
 */
const RuleActionsOverflowComponent = ({
  rule,
  userHasPermissions,
  canDuplicateRuleWithActions,
  showBulkDuplicateExceptionsConfirmation,
  showManualRuleRunConfirmation,
  confirmDeletion,
}: RuleActionsOverflowComponentProps) => {
  const [isPopoverOpen, , closePopover, togglePopover] = useBoolState();
  const {
    application: { navigateToApp },
    telemetry,
  } = useKibana().services;
  const { startTransaction } = useStartTransaction();
  const { executeBulkAction } = useExecuteBulkAction({ suppressSuccessToast: true });
  const { bulkExport } = useBulkExport();
  const downloadExportedRules = useDownloadExportedRules();
  const { scheduleRuleRun } = useScheduleRuleRun();

  const onRuleDeletedCallback = useCallback(() => {
    navigateToApp(APP_UI_ID, {
      deepLinkId: SecurityPageName.rules,
      path: getRulesUrl(),
    });
  }, [navigateToApp]);

  const {
    actions: { openCustomizationsRevertFlyout },
    state: { doesBaseVersionExist },
  } = useRuleCustomizationsContext();

  const actions = useMemo(
    () =>
      rule != null
        ? [
            <EuiContextMenuItem
              key={i18nActions.DUPLICATE_RULE}
              icon="copy"
              disabled={!canDuplicateRuleWithActions || !userHasPermissions}
              data-test-subj="rules-details-duplicate-rule"
              onClick={async () => {
                startTransaction({ name: SINGLE_RULE_ACTIONS.DUPLICATE });
                closePopover();
                const modalDuplicationConfirmationResult =
                  await showBulkDuplicateExceptionsConfirmation();
                if (modalDuplicationConfirmationResult === null) {
                  return;
                }
                const result = await executeBulkAction({
                  type: BulkActionTypeEnum.duplicate,
                  ids: [rule.id],
                  duplicatePayload: {
                    include_exceptions:
                      modalDuplicationConfirmationResult === DuplicateOptions.withExceptions ||
                      modalDuplicationConfirmationResult ===
                        DuplicateOptions.withExceptionsExcludeExpiredExceptions,
                    include_expired_exceptions: !(
                      modalDuplicationConfirmationResult ===
                      DuplicateOptions.withExceptionsExcludeExpiredExceptions
                    ),
                  },
                });

                const createdRules = result?.attributes.results.created;
                if (createdRules?.length) {
                  goToRuleEditPage(createdRules[0].id, navigateToApp);
                }
              }}
            >
              <EuiToolTip
                position="left"
                content={
                  !canEditRuleWithActions(rule, canDuplicateRuleWithActions)
                    ? i18nActions.LACK_OF_KIBANA_ACTIONS_FEATURE_PRIVILEGES
                    : undefined
                }
              >
                <>{i18nActions.DUPLICATE_RULE}</>
              </EuiToolTip>
            </EuiContextMenuItem>,
            <EuiContextMenuItem
              key={i18nActions.EXPORT_RULE}
              icon="exportAction"
              disabled={!userHasPermissions}
              data-test-subj="rules-details-export-rule"
              onClick={async () => {
                startTransaction({ name: SINGLE_RULE_ACTIONS.EXPORT });
                closePopover();
                const response = await bulkExport({ ids: [rule.id] });
                if (response) {
                  await downloadExportedRules(response);
                }
              }}
            >
              {i18nActions.EXPORT_RULE}
            </EuiContextMenuItem>,
            <EuiContextMenuItem
              key={i18nActions.MANUAL_RULE_RUN}
              icon="play"
              disabled={!userHasPermissions || !rule.enabled}
              toolTipContent={
                !userHasPermissions || !rule.enabled ? i18nActions.MANUAL_RULE_RUN_TOOLTIP : ''
              }
              data-test-subj="rules-details-manual-rule-run"
              onClick={async () => {
                startTransaction({ name: SINGLE_RULE_ACTIONS.MANUAL_RULE_RUN });
                closePopover();
                const modalManualRuleRunConfirmationResult = await showManualRuleRunConfirmation();
                telemetry.reportEvent(ManualRuleRunEventTypes.ManualRuleRunOpenModal, {
                  type: 'single',
                });
                if (modalManualRuleRunConfirmationResult === null) {
                  return;
                }
                await scheduleRuleRun({
                  ruleIds: [rule.id],
                  timeRange: modalManualRuleRunConfirmationResult,
                });
              }}
            >
              {i18nActions.MANUAL_RULE_RUN}
            </EuiContextMenuItem>,
            ...(isCustomizedPrebuiltRule(rule) // Don't display action if rule isn't a customized prebuilt rule
              ? [
                  <EuiContextMenuItem
                    key={i18nActions.REVERT_RULE}
                    toolTipContent={
                      !doesBaseVersionExist ? i18nActions.REVERT_RULE_TOOLTIP_CONTENT : undefined
                    }
                    toolTipProps={{
                      title: !doesBaseVersionExist
                        ? i18nActions.REVERT_RULE_TOOLTIP_TITLE
                        : undefined,
                      'data-test-subj': 'rules-details-revert-rule-tooltip',
                    }}
                    icon="timeRefresh"
                    disabled={!userHasPermissions || !doesBaseVersionExist}
                    data-test-subj="rules-details-revert-rule"
                    onClick={() => {
                      closePopover();
                      openCustomizationsRevertFlyout();
                    }}
                  >
                    {i18nActions.REVERT_RULE}
                  </EuiContextMenuItem>,
                ]
              : []),
            <EuiContextMenuItem
              key={i18nActions.DELETE_RULE}
              icon="trash"
              disabled={!userHasPermissions}
              data-test-subj="rules-details-delete-rule"
              onClick={async () => {
                closePopover();

                if ((await confirmDeletion()) === false) {
                  // User has canceled deletion
                  return;
                }

                startTransaction({ name: SINGLE_RULE_ACTIONS.DELETE });
                await executeBulkAction({
                  type: BulkActionTypeEnum.delete,
                  ids: [rule.id],
                });

                onRuleDeletedCallback();
              }}
            >
              {i18nActions.DELETE_RULE}
            </EuiContextMenuItem>,
          ]
        : [],
    [
      rule,
      canDuplicateRuleWithActions,
      userHasPermissions,
      doesBaseVersionExist,
      startTransaction,
      closePopover,
      showBulkDuplicateExceptionsConfirmation,
      executeBulkAction,
      navigateToApp,
      bulkExport,
      downloadExportedRules,
      showManualRuleRunConfirmation,
      telemetry,
      scheduleRuleRun,
      openCustomizationsRevertFlyout,
      confirmDeletion,
      onRuleDeletedCallback,
    ]
  );

  const button = useMemo(
    () => (
      <EuiToolTip position="top" content={i18n.ALL_ACTIONS}>
        <MyEuiButtonIcon
          iconType="boxesHorizontal"
          aria-label={i18n.ALL_ACTIONS}
          isDisabled={!userHasPermissions}
          data-test-subj="rules-details-popover-button-icon"
          onClick={togglePopover}
        />
      </EuiToolTip>
    ),
    [togglePopover, userHasPermissions]
  );

  return (
    <>
      <EuiPopover
        anchorPosition="leftCenter"
        button={button}
        closePopover={closePopover}
        id="ruleActionsOverflow"
        isOpen={isPopoverOpen}
        data-test-subj="rules-details-popover"
        ownFocus={true}
        panelPaddingSize="none"
        repositionOnScroll
      >
        <EuiContextMenuPanel data-test-subj="rules-details-menu-panel" items={actions} />
      </EuiPopover>
    </>
  );
};

export const RuleActionsOverflow = React.memo(RuleActionsOverflowComponent);

RuleActionsOverflow.displayName = 'RuleActionsOverflow';
