/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ComponentType, NamedExoticComponent, ReactNode } from 'react';
import type { CoreStart } from '@kbn/core/public';
import type { DataPublicPluginStart } from '@kbn/data-plugin/public';
import type { DataViewsPublicPluginStart } from '@kbn/data-views-plugin/public';
import type { Storage } from '@kbn/kibana-utils-plugin/public';
import type { TimelinesUIStart } from '@kbn/timelines-plugin/public';
import type { TriggersAndActionsUIPublicPluginStart as TriggersActionsStart } from '@kbn/triggers-actions-ui-plugin/public';
import type { Filter, Query, TimeRange } from '@kbn/es-query';
import type { BrowserField } from '@kbn/rule-registry-plugin/common';
import type { DataProvider } from '@kbn/timelines-plugin/common';
import type { Start as InspectorPluginStart } from '@kbn/inspector-plugin/public';
import type { CasesPublicSetup, CasesPublicStart } from '@kbn/cases-plugin/public/types';
import type { CreateExceptionListItemSchema } from '@kbn/securitysolution-io-ts-list-types';
import type { Policy } from './modules/block_list/hooks/use_policies';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ThreatIntelligencePluginSetup {}

export interface SetupPlugins {
  cases: CasesPublicSetup;
}

export interface ThreatIntelligencePluginStartDeps {
  data: DataPublicPluginStart;
  cases: CasesPublicStart;
  dataViews: DataViewsPublicPluginStart;
  triggersActionsUi: TriggersActionsStart;
  timelines: TimelinesUIStart;
  inspector: InspectorPluginStart;
}

export interface Services extends CoreStart, ThreatIntelligencePluginStartDeps {
  storage: Storage;
}

export interface LicenseAware {
  isEnterprise(): boolean;
  isPlatinumPlus(): boolean;
}

export type BrowserFields = Readonly<Record<string, Partial<BrowserField>>>;

export interface UseInvestigateInTimelineProps {
  dataProviders: DataProvider[];
  from: string;
  to: string;
}

export interface BlockListFlyoutProps {
  apiClient: unknown;
  item: CreateExceptionListItemSchema;
  policies: Policy[];
  policiesIsLoading: boolean;
  FormComponent: NamedExoticComponent<BlockListFormProps>;
  onClose: () => void;
}

export interface BlockListFormProps {
  item: CreateExceptionListItemSchema;
}

export interface Blocking {
  canWriteBlocklist: boolean;
  exceptionListApiClient: unknown;
  useSetUrlParams: () => (
    params: Record<string, string | number | null | undefined>,
    replace?: boolean | undefined
  ) => void;
  getFlyoutComponent: () => NamedExoticComponent<BlockListFlyoutProps>;
  getFormComponent: () => NamedExoticComponent<BlockListFormProps>;
}

/**
 * Methods exposed from the security solution to the threat intelligence application.
 */
export interface SecuritySolutionPluginContext {
  /**
   * Gets the `PageWrapper` component for embedding a filter bar in the security solution application.
   * */
  getPageWrapper: () => ComponentType<{ children: ReactNode }>;

  /**
   * Get the user's license to drive the Threat Intelligence plugin's visibility.
   */
  licenseService: LicenseAware;

  /**
   * Whether the current user has access to timeline
   */
  hasAccessToTimeline: boolean;

  useQuery: () => Query;

  useFilters: () => Filter[];

  useGlobalTime: () => TimeRange;

  /**
   * Register query in security solution store for tracking and centralized refresh support
   */
  registerQuery: (query: { id: string; loading: boolean; refetch: VoidFunction }) => void;

  /**
   * Deregister stale query
   */
  deregisterQuery: (query: { id: string }) => void;

  /**
   * Add to blocklist feature
   */
  blockList: Blocking;
}

/**
 * All the names for the threat intelligence pages.
 *
 * Example to add more names:
 *   export type TIPage = 'indicators' | 'feed';
 */
export type TIPage = 'indicators';

/**
 * All the IDs for the threat intelligence pages.
 * This needs to match the threat intelligence page entries in SecurityPageName` (x-pack/solutions/security/plugins/security_solution/common/constants.ts).
 *
 * Example to add more IDs:
 *   export type TIPageId = 'threat_intelligence' | 'threat_intelligence-feed';
 */
export type TIPageId = 'threat_intelligence';

/**
 * A record of all the properties that will be used to build deeplinks, links and navtabs objects.
 */
export interface TIPageProperties {
  id: TIPageId;
  readonly oldNavigationName: string; // delete when the old navigation is removed
  readonly newNavigationName: string; // rename to name when the old navigation is removed
  readonly path: string;
  readonly disabled: boolean;
  readonly description: string;
  readonly globalSearchKeywords: string[];
  readonly keywords: string[];
}
