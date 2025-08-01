/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { i18n } from '@kbn/i18n';
import { EuiButton, EuiContextMenuItem } from '@elastic/eui';

import { useCanEditSynthetics } from '../../../../../hooks/use_capabilities';
import { useSyntheticsSettingsContext } from '../../../contexts';
import { NoPermissionsTooltip } from '../../common/components/permissions';
import { useGetUrlParams } from '../../../hooks';

export const EditMonitorLink = () => {
  const { basePath } = useSyntheticsSettingsContext();

  const { monitorId } = useParams<{ monitorId: string }>();
  const { spaceId } = useGetUrlParams();
  const canEditSynthetics = useCanEditSynthetics();
  const isLinkDisabled = !canEditSynthetics;
  const linkProps = isLinkDisabled
    ? { disabled: true }
    : {
        href:
          `${basePath}/app/synthetics/edit-monitor/${monitorId}` +
          (spaceId ? `?spaceId=${spaceId}` : ''),
      };

  return (
    <NoPermissionsTooltip canEditSynthetics={canEditSynthetics}>
      <EuiButton
        data-test-subj="syntheticsEditMonitorLinkButton"
        fill
        iconType="pencil"
        iconSide="left"
        {...linkProps}
      >
        {EDIT_MONITOR}
      </EuiButton>
    </NoPermissionsTooltip>
  );
};

export const EditMonitorContextItem = () => {
  const { basePath } = useSyntheticsSettingsContext();
  const { monitorId } = useParams<{ monitorId: string }>();
  const { spaceId } = useGetUrlParams();
  const canEditSynthetics = useCanEditSynthetics();
  const isLinkDisabled = !canEditSynthetics;
  const linkProps = isLinkDisabled
    ? { disabled: true }
    : {
        href:
          `${basePath}/app/synthetics/edit-monitor/${monitorId}` +
          (spaceId ? `?spaceId=${spaceId}` : ''),
      };

  return (
    <EuiContextMenuItem
      icon={'pencil'}
      data-test-subj="syntheticsEditMonitorContextItem"
      {...linkProps}
      disabled={isLinkDisabled}
    >
      {EDIT_MONITOR}
    </EuiContextMenuItem>
  );
};

const EDIT_MONITOR = i18n.translate('xpack.synthetics.monitorSummary.editMonitor', {
  defaultMessage: 'Edit monitor',
});
