/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import React from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { EuiIcon, EuiPageHeaderProps } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';
import { MonitorDetailsAlerts } from './monitor_alerts/monitor_detail_alerts';
import { MonitorAlertsIcon } from './monitor_alerts/alerts_icon';
import { MonitorNotFoundPage } from './monitor_not_found_page';
import { MonitorDetailsPageTitle } from './monitor_details_page_title';
import { MonitorDetailsLastRun } from './monitor_details_last_run';
import { MonitorDetailsStatus } from './monitor_details_status';
import { MonitorDetailsLocation } from './monitor_details_location';
import { MonitorErrors } from './monitor_errors/monitor_errors';
import { MonitorErrorsIcon } from './monitor_errors/errors_icon';
import { MonitorHistory } from './monitor_history/monitor_history';
import { MonitorSummary } from './monitor_summary/monitor_summary';
import { Actions } from './actions';
import {
  MONITOR_ALERTS_ROUTE,
  MONITOR_ERRORS_ROUTE,
  MONITOR_HISTORY_ROUTE,
  MONITOR_NOT_FOUND_ROUTE,
  MONITOR_ROUTE,
  MONITORS_ROUTE,
} from '../../../../../common/constants';
import { RouteProps } from '../../routes';

export const getMonitorDetailsRoute = (
  history: ReturnType<typeof useHistory>,
  syntheticsPath: string,
  baseTitle: string
): RouteProps[] => {
  return [
    {
      title: i18n.translate('xpack.synthetics.monitorDetails.title', {
        defaultMessage: 'Synthetics Monitor Details | {baseTitle}',
        values: { baseTitle },
      }),
      path: MONITOR_ROUTE,
      component: MonitorSummary,
      dataTestSubj: 'syntheticsMonitorDetailsPage',
      pageHeader: getMonitorSummaryHeader(history, syntheticsPath, 'overview'),
    },
    {
      title: i18n.translate('xpack.synthetics.monitorHistory.title', {
        defaultMessage: 'Synthetics Monitor History | {baseTitle}',
        values: { baseTitle },
      }),
      path: MONITOR_HISTORY_ROUTE,
      component: MonitorHistory,
      dataTestSubj: 'syntheticsMonitorHistoryPage',
      pageHeader: getMonitorSummaryHeader(history, syntheticsPath, 'history'),
    },
    {
      title: i18n.translate('xpack.synthetics.monitorErrors.title', {
        defaultMessage: 'Synthetics Monitor Errors | {baseTitle}',
        values: { baseTitle },
      }),
      path: MONITOR_ERRORS_ROUTE,
      component: MonitorErrors,
      dataTestSubj: 'syntheticsMonitorHistoryPage',
      pageHeader: getMonitorSummaryHeader(history, syntheticsPath, 'errors'),
    },
    {
      title: i18n.translate('xpack.synthetics.monitorErrors.title', {
        defaultMessage: 'Synthetics Monitor Alerts | {baseTitle}',
        values: { baseTitle },
      }),
      path: MONITOR_ALERTS_ROUTE,
      component: MonitorDetailsAlerts,
      dataTestSubj: 'syntheticsMonitorAlertsPage',
      pageHeader: getMonitorSummaryHeader(history, syntheticsPath, 'alerts'),
    },
    {
      title: i18n.translate('xpack.synthetics.monitorNotFound.title', {
        defaultMessage: 'Synthetics Monitor Not Found | {baseTitle}',
        values: { baseTitle },
      }),
      path: MONITOR_NOT_FOUND_ROUTE,
      component: MonitorNotFoundPage,
      dataTestSubj: 'syntheticsMonitorNotFoundPage',
      pageHeader: {
        breadcrumbs: [getMonitorsBreadcrumb(syntheticsPath)],
      },
    },
  ];
};

const getMonitorsBreadcrumb = (syntheticsPath: string) => ({
  text: (
    <>
      <EuiIcon size="s" type="arrowLeft" />{' '}
      <FormattedMessage
        id="xpack.synthetics.monitorSummaryRoute.monitorBreadcrumb"
        defaultMessage="Monitors"
      />
    </>
  ),
  color: 'primary' as const,
  'aria-current': false,
  href: `${syntheticsPath}${MONITORS_ROUTE}`,
});

const getMonitorSummaryHeader = (
  history: ReturnType<typeof useHistory>,
  syntheticsPath: string,
  selectedTab: 'overview' | 'history' | 'errors' | 'alerts'
): EuiPageHeaderProps => {
  // Not a component, but it doesn't matter. Hooks are just functions
  const match = useRouteMatch<{ monitorId: string }>(MONITOR_ROUTE); // eslint-disable-line react-hooks/rules-of-hooks

  if (!match) {
    return {};
  }

  const search = history.location.search;
  const monitorId = match.params.monitorId;

  const rightSideItems = [
    <Actions />,
    <MonitorDetailsLastRun />,
    <MonitorDetailsStatus />,
    <MonitorDetailsLocation />,
  ];

  return {
    pageTitle: <MonitorDetailsPageTitle />,
    breadcrumbs: [getMonitorsBreadcrumb(syntheticsPath)],
    rightSideItems,
    tabs: [
      {
        label: i18n.translate('xpack.synthetics.monitorOverviewTab.title', {
          defaultMessage: 'Overview',
        }),
        isSelected: selectedTab === 'overview',
        href: `${syntheticsPath}${MONITOR_ROUTE.replace(':monitorId?', monitorId)}${search}`,
        'data-test-subj': 'syntheticsMonitorOverviewTab',
      },
      {
        label: i18n.translate('xpack.synthetics.monitorHistoryTab.title', {
          defaultMessage: 'History',
        }),
        isSelected: selectedTab === 'history',
        href: `${syntheticsPath}${MONITOR_HISTORY_ROUTE.replace(':monitorId', monitorId)}${search}`,
        'data-test-subj': 'syntheticsMonitorHistoryTab',
      },
      {
        label: i18n.translate('xpack.synthetics.monitorErrorsTab.title', {
          defaultMessage: 'Errors',
        }),
        prepend: <MonitorErrorsIcon />,
        isSelected: selectedTab === 'errors',
        href: `${syntheticsPath}${MONITOR_ERRORS_ROUTE.replace(':monitorId', monitorId)}${search}`,
        'data-test-subj': 'syntheticsMonitorErrorsTab',
      },
      {
        label: i18n.translate('xpack.synthetics.monitorAlertsTab.title', {
          defaultMessage: 'Alerts',
        }),
        prepend: <MonitorAlertsIcon />,
        isSelected: selectedTab === 'alerts',
        href: `${syntheticsPath}${MONITOR_ALERTS_ROUTE.replace(':monitorId', monitorId)}${search}`,
        'data-test-subj': 'syntheticsMonitorAlertsTab',
      },
    ],
  };
};
