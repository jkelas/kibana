/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import dateMath from '@kbn/datemath';
import classNames from 'classnames';
import { css } from '@emotion/react';
import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import deepEqual from 'fast-deep-equal';
import useObservable from 'react-use/lib/useObservable';
import type { Filter, TimeRange, Query, AggregateQuery } from '@kbn/es-query';
import {
  getAggregateQueryMode,
  isOfQueryType,
  isOfAggregateQueryType,
  getLanguageDisplayName,
} from '@kbn/es-query';
import { ESQLLangEditor, type ESQLEditorProps } from '@kbn/esql/public';
import { EMPTY } from 'rxjs';
import { map } from 'rxjs';
import { throttle } from 'lodash';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiSuperDatePicker,
  EuiFieldText,
  usePrettyDuration,
  EuiIconProps,
  OnRefreshProps,
  useIsWithinBreakpoints,
  EuiSuperUpdateButton,
  EuiToolTip,
  EuiButton,
  EuiButtonIcon,
  useEuiTheme,
  UseEuiTheme,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { TimeHistoryContract, getQueryLog } from '@kbn/data-plugin/public';
import type { DataView } from '@kbn/data-views-plugin/public';
import type { PersistedLog } from '@kbn/data-plugin/public';
import { useKibana } from '@kbn/kibana-react-plugin/public';
import { UI_SETTINGS } from '@kbn/data-plugin/common';
import type { IUnifiedSearchPluginServices, UnifiedSearchDraft } from '../types';
import { QueryStringInput } from './query_string_input';
import { NoDataPopover } from './no_data_popover';
import { shallowEqual } from '../utils/shallow_equal';
import { AddFilterPopover } from './add_filter_popover';
import { DataViewPicker, DataViewPickerProps } from '../dataview_picker';
import { ESQLMenuPopover, type ESQLMenuPopoverProps } from './esql_menu_popover';

import { FilterButtonGroup } from '../filter_bar/filter_button_group/filter_button_group';
import type {
  SuggestionsAbstraction,
  SuggestionsListSize,
} from '../typeahead/suggestions_component';

export const strings = {
  getNeedsUpdatingLabel: () =>
    i18n.translate('unifiedSearch.queryBarTopRow.submitButton.update', {
      defaultMessage: 'Needs updating',
    }),
  getUpdateButtonLabel: () =>
    i18n.translate('unifiedSearch.queryBarTopRow.submitButton.updateButton', {
      defaultMessage: 'Update',
    }),
  getRefreshQueryLabel: () =>
    i18n.translate('unifiedSearch.queryBarTopRow.submitButton.refresh', {
      defaultMessage: 'Refresh query',
    }),
  getRefreshButtonLabel: () =>
    i18n.translate('unifiedSearch.queryBarTopRow.submitButton.refreshButton', {
      defaultMessage: 'Refresh',
    }),
  getCancelQueryLabel: () =>
    i18n.translate('unifiedSearch.queryBarTopRow.submitButton.cancel', {
      defaultMessage: 'Cancel',
    }),
  getRunQueryLabel: () =>
    i18n.translate('unifiedSearch.queryBarTopRow.submitButton.run', {
      defaultMessage: 'Run query',
    }),
  getRunButtonLabel: () =>
    i18n.translate('unifiedSearch.queryBarTopRow.submitButton.runButton', {
      defaultMessage: 'Run',
    }),
  getDisabledDatePickerLabel: () =>
    i18n.translate('unifiedSearch.queryBarTopRow.datePicker.disabledLabel', {
      defaultMessage: 'All time',
    }),
};

const getWrapperWithTooltip = (
  children: JSX.Element,
  enableTooltip: boolean,
  query?: Query | AggregateQuery
) => {
  if (enableTooltip && query && isOfAggregateQueryType(query)) {
    const textBasedLanguage = getAggregateQueryMode(query);
    const displayName = getLanguageDisplayName(textBasedLanguage);
    return (
      <EuiToolTip
        position="top"
        content={i18n.translate('unifiedSearch.query.queryBar.textBasedNonTimestampWarning', {
          defaultMessage:
            'Date range selection for {language} queries requires an @timestamp field in the dataset.',
          values: { language: displayName },
        })}
      >
        {children}
      </EuiToolTip>
    );
  } else {
    return children;
  }
};

const SuperDatePicker = React.memo(
  EuiSuperDatePicker as any
) as unknown as typeof EuiSuperDatePicker;

// @internal
export interface QueryBarTopRowProps<QT extends Query | AggregateQuery = Query> {
  customSubmitButton?: any;
  dataViewPickerOverride?: ReactNode;
  dataTestSubj?: string;
  dateRangeFrom?: string;
  dateRangeTo?: string;
  disableAutoFocus?: boolean;
  fillSubmitButton: boolean;
  iconType?: EuiIconProps['type'];
  indexPatterns?: Array<DataView | string>;
  indicateNoData?: boolean;
  isClearable?: boolean;
  isDirty: boolean;
  isLoading?: boolean;
  isRefreshPaused?: boolean;
  nonKqlMode?: 'lucene' | 'text';
  onChange: (payload: { dateRange: TimeRange; query?: Query | QT }) => void;
  onRefresh?: (payload: { dateRange: TimeRange }) => void;
  onRefreshChange?: (options: { isPaused: boolean; refreshInterval: number }) => void;
  onSubmit: (payload: { dateRange: TimeRange; query?: Query | QT }) => void;
  onCancel?: () => void;
  onDraftChange?: (draft: UnifiedSearchDraft | undefined) => void;
  placeholder?: string;
  prepend?: React.ComponentProps<typeof EuiFieldText>['prepend'];
  query?: Query | QT;
  refreshInterval?: number;
  minRefreshInterval?: number;
  screenTitle?: string;
  showQueryInput?: boolean;
  showAddFilter?: boolean;
  showDatePicker?: boolean;
  isDisabled?: boolean;
  showAutoRefreshOnly?: boolean;
  timeHistory?: TimeHistoryContract;
  timeRangeForSuggestionsOverride?: boolean;
  filtersForSuggestions?: Filter[];
  filters: Filter[];
  onFiltersUpdated?: (filters: Filter[]) => void;
  dataViewPickerComponentProps?: DataViewPickerProps;
  textBasedLanguageModeErrors?: Error[];
  textBasedLanguageModeWarning?: string;
  filterBar?: React.ReactNode;
  showDatePickerAsBadge?: boolean;
  showSubmitButton?: boolean;
  /**
   * Style of the submit button
   * `iconOnly` - use IconButton
   * `full` - use SuperUpdateButton
   * (default) `auto` - `iconOnly` on smaller screens, and `full` on larger screens
   */
  submitButtonStyle?: 'auto' | 'iconOnly' | 'full';
  suggestionsSize?: SuggestionsListSize;
  suggestionsAbstraction?: SuggestionsAbstraction;
  isScreenshotMode?: boolean;
  onTextLangQuerySubmit: (query?: Query | AggregateQuery) => void;
  onTextLangQueryChange: (query: AggregateQuery) => void;
  submitOnBlur?: boolean;
  renderQueryInputAppend?: () => React.ReactNode;
  disableExternalPadding?: boolean;
  onESQLDocsFlyoutVisibilityChanged?: ESQLMenuPopoverProps['onESQLDocsFlyoutVisibilityChanged'];
  bubbleSubmitEvent?: boolean;

  esqlEditorInitialState?: ESQLEditorProps['initialState'];
  onEsqlEditorInitialStateChange?: ESQLEditorProps['onInitialStateChange'];
}

export const SharingMetaFields = React.memo(function SharingMetaFields({
  from,
  to,
  dateFormat,
}: {
  from: string;
  to: string;
  dateFormat: string;
}) {
  function toAbsoluteString(value: string, roundUp = false) {
    const valueAsMoment = dateMath.parse(value, { roundUp });
    if (!valueAsMoment) {
      return value;
    }
    return valueAsMoment.toISOString();
  }

  try {
    const dateRangePretty = usePrettyDuration({
      timeFrom: toAbsoluteString(from),
      timeTo: toAbsoluteString(to, true),
      quickRanges: [],
      dateFormat,
    });
    return (
      <div
        data-shared-timefilter-duration={dateRangePretty}
        data-test-subj="dataSharedTimefilterDuration"
      />
    );
  } catch (e) {
    return <div data-test-subj="dataSharedTimefilterDuration" />;
  }
});

type GenericQueryBarTopRow = <QT extends AggregateQuery | Query = Query>(
  props: QueryBarTopRowProps<QT>
) => React.ReactElement;

export const QueryBarTopRow = React.memo(
  function QueryBarTopRow<QT extends Query | AggregateQuery = Query>(
    props: QueryBarTopRowProps<QT>
  ) {
    const isMobile = useIsWithinBreakpoints(['xs', 's']);
    const [isXXLarge, setIsXXLarge] = useState<boolean>(false);
    const submitButtonStyle: QueryBarTopRowProps['submitButtonStyle'] =
      props.submitButtonStyle ?? 'auto';
    const submitButtonIconOnly =
      submitButtonStyle === 'auto' ? !isXXLarge : submitButtonStyle === 'iconOnly';

    useEffect(() => {
      if (submitButtonStyle !== 'auto') return;

      const handleResize = throttle(() => {
        setIsXXLarge(window.innerWidth >= 1440);
      }, 50);

      window.addEventListener('resize', handleResize);
      handleResize();

      return () => window.removeEventListener('resize', handleResize);
    }, [submitButtonStyle]);

    const {
      showQueryInput = true,
      showDatePicker = true,
      showAutoRefreshOnly = false,
      showSubmitButton = true,
    } = props;

    const [isDateRangeInvalid, setIsDateRangeInvalid] = useState(false);
    const [isQueryInputFocused, setIsQueryInputFocused] = useState(false);

    const kibana = useKibana<IUnifiedSearchPluginServices>();

    const {
      uiSettings,
      storage,
      appName,
      data,
      usageCollection,
      unifiedSearch,
      notifications,
      docLinks,
      http,
      dataViews,
    } = kibana.services;

    const isQueryLangSelected = props.query && !isOfQueryType(props.query);

    const queryLanguage = props.query && isOfQueryType(props.query) && props.query.language;
    const queryRef = useRef<Query | QT | undefined>(props.query);
    queryRef.current = props.query;

    const persistedLog: PersistedLog | undefined = React.useMemo(
      () =>
        queryLanguage && uiSettings && storage && appName
          ? getQueryLog(uiSettings!, storage, appName, queryLanguage)
          : undefined,
      [appName, queryLanguage, uiSettings, storage]
    );

    function getDateRange() {
      const defaultTimeSetting = uiSettings!.get(UI_SETTINGS.TIMEPICKER_TIME_DEFAULTS);
      return {
        from: props.dateRangeFrom || defaultTimeSetting.from,
        to: props.dateRangeTo || defaultTimeSetting.to,
      };
    }

    const currentDateRange = getDateRange();
    const dateRangeRef = useRef<{ from: string; to: string }>(currentDateRange);
    dateRangeRef.current = currentDateRange;

    const propsOnSubmit = props.onSubmit;
    const propsOnCancel = props.onCancel;

    const toRecentlyUsedRanges = (ranges: TimeRange[]) =>
      ranges.map(({ from, to }: { from: string; to: string }) => {
        return {
          start: from,
          end: to,
        };
      });
    const timeHistory = props.timeHistory;
    const timeHistory$ = useMemo(
      () => timeHistory?.get$().pipe(map(toRecentlyUsedRanges)) ?? EMPTY,
      [timeHistory]
    );

    const recentlyUsedRanges = useObservable(
      timeHistory$,
      toRecentlyUsedRanges(timeHistory?.get() ?? [])
    );
    const [commonlyUsedRanges] = useState(() => {
      return (
        uiSettings
          ?.get(UI_SETTINGS.TIMEPICKER_QUICK_RANGES)
          ?.map(({ from, to, display }: { from: string; to: string; display: string }) => {
            return {
              start: from,
              end: to,
              label: display,
            };
          }) ?? []
      );
    });

    const onSubmit = useCallback(
      ({ query, dateRange }: { query?: Query | QT; dateRange: TimeRange }) => {
        if (timeHistory) {
          timeHistory.add(dateRange);
        }

        propsOnSubmit({ query, dateRange });
      },
      [timeHistory, propsOnSubmit]
    );

    const onClickSubmitButton = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        if (persistedLog && queryRef.current && isOfQueryType(queryRef.current)) {
          persistedLog.add(queryRef.current.query);
        }
        event.preventDefault();
        onSubmit({
          query: queryRef.current,
          dateRange: dateRangeRef.current,
        });
      },
      [persistedLog, onSubmit]
    );

    const onClickCancelButton = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        if (persistedLog && queryRef.current && isOfQueryType(queryRef.current)) {
          persistedLog.add(queryRef.current.query);
        }
        event.preventDefault();

        if (propsOnCancel) {
          propsOnCancel();
        }
      },
      [persistedLog, propsOnCancel]
    );

    const propsOnChange = props.onChange;
    const onQueryChange = useCallback(
      (query: Query) => {
        return propsOnChange({
          query,
          dateRange: dateRangeRef.current,
        });
      },
      [propsOnChange]
    );

    const onChangeQueryInputFocus = useCallback((isFocused: boolean) => {
      setIsQueryInputFocused(isFocused);
    }, []);

    const onTimeChange = useCallback(
      ({
        start,
        end,
        isInvalid,
        isQuickSelection,
      }: {
        start: string;
        end: string;
        isInvalid: boolean;
        isQuickSelection: boolean;
      }) => {
        setIsDateRangeInvalid(isInvalid);
        const retVal = {
          query: queryRef.current,
          dateRange: {
            from: start,
            to: end,
          },
        };

        if (isQuickSelection) {
          onSubmit(retVal);
        } else {
          propsOnChange(retVal);
        }
      },
      [propsOnChange, onSubmit]
    );

    const propsOnRefresh = props.onRefresh;
    const onRefresh = useCallback(
      ({ start, end }: OnRefreshProps) => {
        const retVal = {
          dateRange: {
            from: start,
            to: end,
          },
        };
        if (propsOnRefresh) {
          propsOnRefresh(retVal);
        }
      },
      [propsOnRefresh]
    );

    const onInputSubmit = useCallback(
      (query: Query) => {
        onSubmit({
          query,
          dateRange: dateRangeRef.current,
        });
      },
      [onSubmit]
    );

    const {
      onDraftChange,
      isDirty: draftIsDirty,
      query: draftQuery,
      dateRangeFrom: draftDateRangeFrom,
      dateRangeTo: draftDateRangeTo,
    } = props;
    const draft = useMemo(
      () =>
        onDraftChange && draftIsDirty
          ? {
              query: draftQuery,
              dateRangeFrom: showDatePicker ? draftDateRangeFrom : undefined,
              dateRangeTo: showDatePicker ? draftDateRangeTo : undefined,
            }
          : undefined,
      [
        onDraftChange,
        draftIsDirty,
        draftQuery,
        draftDateRangeFrom,
        draftDateRangeTo,
        showDatePicker,
      ]
    );

    useEffect(() => {
      onDraftChange?.(draft);
    }, [onDraftChange, draft]);

    function shouldRenderQueryInput(): boolean {
      return Boolean(showQueryInput && props.query && storage);
    }

    function shouldRenderDatePicker(): boolean {
      return Boolean(showDatePicker || showAutoRefreshOnly);
    }

    function renderFilterMenuOnly(): boolean {
      return !Boolean(props.showAddFilter) && Boolean(props.prepend);
    }

    function shouldRenderUpdatebutton(): boolean {
      return (
        Boolean(showSubmitButton) &&
        Boolean(showQueryInput || showDatePicker || showAutoRefreshOnly)
      );
    }

    function shouldShowDatePickerAsBadge(): boolean {
      return (
        (Boolean(props.showDatePickerAsBadge) && !shouldRenderQueryInput()) ||
        Boolean(isQueryLangSelected && props.query && isOfAggregateQueryType(props.query))
      );
    }

    function renderDatePicker() {
      if (!shouldRenderDatePicker()) {
        return null;
      }
      let isDisabled: boolean | { display: React.ReactNode } = Boolean(props.isDisabled);
      let enableTooltip = false;
      // On text based mode the datepicker is always on when the user has unsaved changes.
      // When the user doesn't have any changes it should be disabled if dataview doesn't have @timestamp field
      if (Boolean(isQueryLangSelected) && !props.isDirty) {
        const adHocDataview = props.indexPatterns?.[0];
        if (adHocDataview && typeof adHocDataview !== 'string') {
          if (!adHocDataview.timeFieldName) {
            isDisabled = {
              display: (
                <span data-test-subj="kbnQueryBar-datePicker-disabled">
                  {strings.getDisabledDatePickerLabel()}
                </span>
              ),
            };
          }
          enableTooltip = !Boolean(adHocDataview.timeFieldName);
        }
      }

      const wrapperClasses = classNames('kbnQueryBar__datePickerWrapper');

      const datePicker = (
        <SuperDatePicker
          isDisabled={isDisabled}
          start={props.dateRangeFrom}
          end={props.dateRangeTo}
          isPaused={props.isRefreshPaused}
          refreshInterval={props.refreshInterval}
          refreshMinInterval={props.minRefreshInterval}
          onTimeChange={onTimeChange}
          onRefresh={onRefresh}
          onRefreshChange={props.onRefreshChange}
          showUpdateButton={false}
          recentlyUsedRanges={recentlyUsedRanges}
          locale={i18n.getLocale()}
          commonlyUsedRanges={commonlyUsedRanges}
          dateFormat={uiSettings.get('dateFormat')}
          isAutoRefreshOnly={showAutoRefreshOnly}
          className="kbnQueryBar__datePicker"
          isQuickSelectOnly={isMobile ? false : isQueryInputFocused}
          width={isMobile ? 'full' : 'auto'}
          compressed={shouldShowDatePickerAsBadge()}
        />
      );
      const component = getWrapperWithTooltip(datePicker, enableTooltip, props.query);

      return (
        <EuiFlexItem className={wrapperClasses} css={inputStringStyles.datePickerWrapper}>
          {component}
        </EuiFlexItem>
      );
    }

    function renderCancelButton() {
      const buttonLabelCancel = strings.getCancelQueryLabel();

      if (submitButtonIconOnly) {
        return (
          <EuiButtonIcon
            iconType="cross"
            aria-label={buttonLabelCancel}
            onClick={onClickCancelButton}
            size={shouldShowDatePickerAsBadge() ? 's' : 'm'}
            data-test-subj="queryCancelButton"
            color="text"
            display="base"
          >
            {buttonLabelCancel}
          </EuiButtonIcon>
        );
      }

      return (
        <EuiButton
          iconType="cross"
          aria-label={buttonLabelCancel}
          onClick={onClickCancelButton}
          size={shouldShowDatePickerAsBadge() ? 's' : 'm'}
          data-test-subj="queryCancelButton"
          color="text"
        >
          {buttonLabelCancel}
        </EuiButton>
      );
    }

    function renderUpdateButton() {
      if (!shouldRenderUpdatebutton() && !shouldRenderDatePicker()) {
        return null;
      }
      const iconDirty = Boolean(isQueryLangSelected) ? 'playFilled' : 'kqlFunction';
      const labelDirty = Boolean(isQueryLangSelected)
        ? strings.getRunQueryLabel()
        : strings.getNeedsUpdatingLabel();
      const buttonLabelDirty = Boolean(isQueryLangSelected)
        ? strings.getRunButtonLabel()
        : strings.getUpdateButtonLabel();

      const button = props.customSubmitButton ? (
        React.cloneElement(props.customSubmitButton, { onClick: onClickSubmitButton })
      ) : (
        <EuiFlexItem grow={false}>
          {props.isLoading && propsOnCancel && renderCancelButton()}
          {(!props.isLoading || !propsOnCancel) && (
            <EuiSuperUpdateButton
              iconType={props.isDirty ? iconDirty : 'refresh'}
              iconOnly={submitButtonIconOnly}
              aria-label={props.isDirty ? labelDirty : strings.getRefreshQueryLabel()}
              isDisabled={isDateRangeInvalid || props.isDisabled}
              isLoading={props.isLoading}
              onClick={onClickSubmitButton}
              size={shouldShowDatePickerAsBadge() ? 's' : 'm'}
              color={props.isDirty ? 'success' : 'primary'}
              fill={false}
              needsUpdate={props.isDirty}
              data-test-subj="querySubmitButton"
              toolTipProps={{
                content: props.isDirty ? labelDirty : strings.getRefreshQueryLabel(),
                delay: 'long',
                position: 'bottom',
              }}
            >
              {props.isDirty ? buttonLabelDirty : strings.getRefreshButtonLabel()}
            </EuiSuperUpdateButton>
          )}
        </EuiFlexItem>
      );

      // allows to render the button without the datepicker
      if (!shouldRenderDatePicker() && shouldRenderUpdatebutton()) {
        return button;
      }

      return (
        <EuiFlexItem grow={false}>
          <NoDataPopover storage={storage} showNoDataPopover={props.indicateNoData}>
            <EuiFlexGroup alignItems="center" responsive={false} gutterSize="s">
              {shouldRenderDatePicker() ? renderDatePicker() : null}
              {shouldRenderUpdatebutton() ? button : null}
            </EuiFlexGroup>
          </NoDataPopover>
        </EuiFlexItem>
      );
    }

    function renderDataViewsPicker() {
      if (props.dataViewPickerComponentProps && !Boolean(isQueryLangSelected)) {
        return (
          <EuiFlexItem css={{ maxWidth: '100%' }} grow={isMobile}>
            <DataViewPicker
              {...props.dataViewPickerComponentProps}
              trigger={{ fullWidth: isMobile, ...props.dataViewPickerComponentProps.trigger }}
              isDisabled={props.isDisabled}
            />
          </EuiFlexItem>
        );
      }
    }

    function renderAddButton() {
      return (
        Boolean(props.showAddFilter) && (
          <EuiFlexItem grow={false}>
            <AddFilterPopover
              indexPatterns={props.indexPatterns}
              filters={props.filters}
              timeRangeForSuggestionsOverride={props.timeRangeForSuggestionsOverride}
              filtersForSuggestions={props.filtersForSuggestions}
              onFiltersUpdated={props.onFiltersUpdated}
              buttonProps={{
                size: shouldShowDatePickerAsBadge() ? 's' : 'm',
                display: 'empty',
              }}
              isDisabled={props.isDisabled}
              suggestionsAbstraction={props.suggestionsAbstraction}
            />
          </EuiFlexItem>
        )
      );
    }

    function renderFilterButtonGroup() {
      return (
        (Boolean(props.showAddFilter) || Boolean(props.prepend)) && (
          <EuiFlexItem grow={false} className="kbnQueryBar__filterButtonGroup">
            <FilterButtonGroup
              items={[props.prepend, renderAddButton()]}
              attached={renderFilterMenuOnly()}
              size={shouldShowDatePickerAsBadge() ? 's' : 'm'}
            />
          </EuiFlexItem>
        )
      );
    }

    function renderQueryInput() {
      const filterButtonGroup = !renderFilterMenuOnly() && renderFilterButtonGroup();
      const queryInput = shouldRenderQueryInput() && (
        <EuiFlexItem data-test-subj="unifiedQueryInput">
          <QueryStringInput
            disableAutoFocus={props.disableAutoFocus}
            indexPatterns={props.indexPatterns!}
            query={props.query! as Query}
            screenTitle={props.screenTitle}
            onChange={onQueryChange}
            onChangeQueryInputFocus={onChangeQueryInputFocus}
            onSubmit={onInputSubmit}
            persistedLog={persistedLog}
            dataTestSubj={props.dataTestSubj}
            placeholder={props.placeholder}
            isClearable={props.isClearable}
            iconType={props.iconType}
            nonKqlMode={props.nonKqlMode}
            timeRangeForSuggestionsOverride={props.timeRangeForSuggestionsOverride}
            filtersForSuggestions={props.filtersForSuggestions}
            disableLanguageSwitcher={true}
            prepend={renderFilterMenuOnly() && renderFilterButtonGroup()}
            size={props.suggestionsSize}
            suggestionsAbstraction={props.suggestionsAbstraction}
            isDisabled={props.isDisabled}
            appName={appName}
            submitOnBlur={props.submitOnBlur}
            bubbleSubmitEvent={props.bubbleSubmitEvent}
            deps={{
              unifiedSearch,
              data,
              storage,
              usageCollection,
              notifications,
              docLinks,
              http,
              uiSettings,
              dataViews,
            }}
          />
        </EuiFlexItem>
      );
      if (isQueryLangSelected || (!filterButtonGroup && !queryInput)) {
        return null;
      }
      return (
        <EuiFlexItem
          grow={!shouldShowDatePickerAsBadge()}
          style={{ minWidth: shouldShowDatePickerAsBadge() ? 'auto' : 320, maxWidth: '100%' }}
        >
          <EuiFlexGroup gutterSize="s" responsive={false}>
            {filterButtonGroup}
            {queryInput}
          </EuiFlexGroup>
        </EuiFlexItem>
      );
    }

    function renderTextLangEditor() {
      const adHocDataview = props.indexPatterns?.[0];
      let detectedTimestamp;
      if (adHocDataview && typeof adHocDataview !== 'string') {
        detectedTimestamp = adHocDataview?.timeFieldName;
      }
      return (
        isQueryLangSelected &&
        props.query &&
        isOfAggregateQueryType(props.query) && (
          <ESQLLangEditor
            query={props.query}
            onTextLangQueryChange={props.onTextLangQueryChange}
            errors={props.textBasedLanguageModeErrors}
            warning={props.textBasedLanguageModeWarning}
            detectedTimestamp={detectedTimestamp}
            expandToFitQueryOnMount
            onTextLangQuerySubmit={async () =>
              onSubmit({
                query: queryRef.current,
                dateRange: dateRangeRef.current,
              })
            }
            isDisabled={props.isDisabled}
            hideRunQueryText={true}
            data-test-subj="unifiedTextLangEditor"
            isLoading={props.isLoading}
            initialState={props.esqlEditorInitialState}
            onInitialStateChange={props.onEsqlEditorInitialStateChange}
          />
        )
      );
    }
    const { euiTheme } = useEuiTheme();
    const isScreenshotMode = props.isScreenshotMode === true;

    return (
      <>
        <SharingMetaFields
          from={currentDateRange.from}
          to={currentDateRange.to}
          dateFormat={uiSettings.get('dateFormat')}
        />
        {!isScreenshotMode && (
          <>
            <EuiFlexGroup
              className="kbnQueryBar"
              direction={isMobile && !shouldShowDatePickerAsBadge() ? 'column' : 'row'}
              responsive={false}
              gutterSize="s"
              css={css`
                padding: ${isQueryLangSelected && !props.disableExternalPadding
                  ? euiTheme.size.s
                  : 0};
              `}
              justifyContent={shouldShowDatePickerAsBadge() ? 'flexStart' : 'flexEnd'}
              wrap
            >
              {props.dataViewPickerOverride || renderDataViewsPicker()}
              {Boolean(isQueryLangSelected) && (
                <ESQLMenuPopover
                  onESQLDocsFlyoutVisibilityChanged={props.onESQLDocsFlyoutVisibilityChanged}
                  onESQLQuerySubmit={(queryString: string) => {
                    onSubmit({
                      query: { esql: queryString } as QT,
                      dateRange: dateRangeRef.current,
                    });
                  }}
                  adHocDataview={props.indexPatterns?.[0]}
                />
              )}
              {renderQueryInput()}
              {props.renderQueryInputAppend?.()}
              {shouldShowDatePickerAsBadge() && props.filterBar}
              {renderUpdateButton()}
            </EuiFlexGroup>
            {!shouldShowDatePickerAsBadge() && props.filterBar}
            {renderTextLangEditor()}
          </>
        )}
      </>
    );
  },
  ({ query: prevQuery, ...prevProps }, { query: nextQuery, ...nextProps }) => {
    let isQueryEqual = true;
    if (prevQuery !== nextQuery) {
      if (!deepEqual(prevQuery, nextQuery)) {
        isQueryEqual = false;
      }
    }

    return isQueryEqual && shallowEqual(prevProps, nextProps);
  }
) as GenericQueryBarTopRow;

const inputStringStyles = {
  datePickerWrapper: ({ euiTheme }: UseEuiTheme) =>
    css({
      '.euiDatePopoverButton-isInvalid': {
        backgroundImage: `linear-gradient(0deg,${euiTheme.colors.danger},${euiTheme.colors.danger} ${euiTheme.size.xxs},#0000 0,#0000)`,
      },
    }),
};
