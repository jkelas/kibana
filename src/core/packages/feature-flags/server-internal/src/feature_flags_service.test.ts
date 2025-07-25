/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { BehaviorSubject, firstValueFrom } from 'rxjs';
import apm from 'elastic-apm-node';
import { type Client, OpenFeature, type Provider } from '@openfeature/server-sdk';
import { mockCoreContext } from '@kbn/core-base-server-mocks';
import { configServiceMock } from '@kbn/config-mocks';
import type { FeatureFlagsStart } from '@kbn/core-feature-flags-server';
import { FeatureFlagsService } from '..';
import { FeatureFlagsConfig } from './feature_flags_config';

describe('FeatureFlagsService Server', () => {
  let featureFlagsService: FeatureFlagsService;
  let featureFlagsClient: Client;
  let config$: BehaviorSubject<FeatureFlagsConfig>;

  beforeEach(() => {
    const getClientSpy = jest.spyOn(OpenFeature, 'getClient');
    const mockedConfigService = configServiceMock.create();
    config$ = new BehaviorSubject<FeatureFlagsConfig>({
      overrides: {
        'my-overridden-flag': true,
        'myPlugin.myOverriddenFlag': true,
        myDestructuredObjPlugin: { myOverriddenFlag: true },
      },
    });
    mockedConfigService.atPath.mockReturnValue(config$);
    featureFlagsService = new FeatureFlagsService(
      mockCoreContext.create({
        configService: mockedConfigService,
      })
    );
    featureFlagsClient = getClientSpy.mock.results[0].value;
  });

  afterEach(async () => {
    jest.useRealTimers();
    await featureFlagsService.stop();
    jest.spyOn(OpenFeature, 'setProviderAndWait').mockRestore(); // Make sure that we clean up any previous mocked implementations
    jest.clearAllMocks();
    await OpenFeature.clearProviders();
  });

  describe('provider handling', () => {
    test('appends a provider (no async operation)', () => {
      expect.assertions(1);
      const { setProvider } = featureFlagsService.setup();
      const spy = jest.spyOn(OpenFeature, 'setProviderAndWait');
      const fakeProvider = { metadata: { name: 'fake provider' } } as Provider;
      setProvider(fakeProvider);
      expect(spy).toHaveBeenCalledWith(fakeProvider);
    });

    test('throws an error if called twice', () => {
      const { setProvider } = featureFlagsService.setup();
      const fakeProvider = { metadata: { name: 'fake provider' } } as Provider;
      setProvider(fakeProvider);
      expect(() => setProvider(fakeProvider)).toThrowErrorMatchingInlineSnapshot(
        `"A provider has already been set. This API cannot be called twice."`
      );
    });
  });

  describe('context handling', () => {
    let setContextSpy: jest.SpyInstance;

    beforeEach(() => {
      setContextSpy = jest.spyOn(OpenFeature, 'setContext');
    });

    test('appends context to the provider', () => {
      const { appendContext } = featureFlagsService.setup();
      appendContext({ kind: 'multi' });
      expect(setContextSpy).toHaveBeenCalledWith({ kind: 'multi' });
    });

    test('appends context to the provider (start method)', () => {
      featureFlagsService.setup();
      const { appendContext } = featureFlagsService.start();
      appendContext({ kind: 'multi' });
      expect(setContextSpy).toHaveBeenCalledWith({ kind: 'multi' });
    });

    test('full multi context pass-through', () => {
      const { appendContext } = featureFlagsService.setup();
      const context = {
        kind: 'multi' as const,
        kibana: {
          key: 'kibana-1',
        },
        organization: {
          key: 'organization-1',
        },
      };
      appendContext(context);
      expect(setContextSpy).toHaveBeenCalledWith(context);
    });

    test('appends to the existing context', () => {
      const { appendContext } = featureFlagsService.setup();
      const initialContext = {
        kind: 'multi' as const,
        kibana: {
          key: 'kibana-1',
        },
        organization: {
          key: 'organization-1',
        },
      };
      appendContext(initialContext);
      expect(setContextSpy).toHaveBeenCalledWith(initialContext);

      appendContext({ kind: 'multi', kibana: { has_data: true } });
      expect(setContextSpy).toHaveBeenCalledWith({
        ...initialContext,
        kibana: {
          ...initialContext.kibana,
          has_data: true,
        },
      });
    });

    test('converts single-contexts to multi-context', () => {
      const { appendContext } = featureFlagsService.setup();
      appendContext({ kind: 'organization', key: 'organization-1' });
      expect(setContextSpy).toHaveBeenCalledWith({
        kind: 'multi',
        organization: {
          key: 'organization-1',
        },
      });
    });

    test('if no `kind` provided, it defaults to the kibana context', () => {
      const { appendContext } = featureFlagsService.setup();
      appendContext({ key: 'key-1', has_data: false });
      expect(setContextSpy).toHaveBeenCalledWith({
        kind: 'multi',
        kibana: {
          key: 'key-1',
          has_data: false,
        },
      });
    });
  });

  describe('flag evaluation', () => {
    let startContract: FeatureFlagsStart;
    let apmSpy: jest.SpyInstance;
    let addHandlerSpy: jest.SpyInstance;

    beforeEach(() => {
      addHandlerSpy = jest.spyOn(featureFlagsClient, 'addHandler');
      featureFlagsService.setup();
      startContract = featureFlagsService.start();
      apmSpy = jest.spyOn(apm, 'addLabels');
    });

    // We don't need to test the client, just our APIs, so testing that it returns the fallback value should be enough.
    test('get boolean flag', async () => {
      const value = false;
      await expect(startContract.getBooleanValue('my-flag', value)).resolves.toEqual(value);
      expect(apmSpy).toHaveBeenCalledWith({ 'flag_my-flag': value });
    });

    test('get string flag', async () => {
      const value = 'my-default';
      await expect(startContract.getStringValue('my-flag', value)).resolves.toEqual(value);
      expect(apmSpy).toHaveBeenCalledWith({ 'flag_my-flag': value });
    });

    test('get number flag', async () => {
      const value = 42;
      await expect(startContract.getNumberValue('my-flag', value)).resolves.toEqual(value);
      expect(apmSpy).toHaveBeenCalledWith({ 'flag_my-flag': value });
    });

    test('observe a boolean flag', async () => {
      const value = false;
      const flag$ = startContract.getBooleanValue$('my-flag', value);
      const observedValues: boolean[] = [];
      flag$.subscribe((v) => observedValues.push(v));
      // Initial emission
      await expect(firstValueFrom(flag$)).resolves.toEqual(value);
      expect(apmSpy).toHaveBeenCalledWith({ 'flag_my-flag': value });
      expect(observedValues).toHaveLength(1);

      // Does not reevaluate and emit if the other flags are changed
      addHandlerSpy.mock.calls[0][1]({ flagsChanged: ['another-flag'] });
      await expect(firstValueFrom(flag$)).resolves.toEqual(value);
      expect(observedValues).toHaveLength(1); // still 1

      // Reevaluates and emits when the observed flag is changed
      addHandlerSpy.mock.calls[0][1]({ flagsChanged: ['my-flag'] });
      await expect(firstValueFrom(flag$)).resolves.toEqual(value);
      expect(observedValues).toHaveLength(2);
    });

    test('observe a string flag', async () => {
      const value = 'my-value';
      const flag$ = startContract.getStringValue$('my-flag', value);
      const observedValues: string[] = [];
      flag$.subscribe((v) => observedValues.push(v));
      // Initial emission
      await expect(firstValueFrom(flag$)).resolves.toEqual(value);
      expect(apmSpy).toHaveBeenCalledWith({ 'flag_my-flag': value });
      expect(observedValues).toHaveLength(1);

      // Does not reevaluate and emit if the other flags are changed
      addHandlerSpy.mock.calls[0][1]({ flagsChanged: ['another-flag'] });
      await expect(firstValueFrom(flag$)).resolves.toEqual(value);
      expect(observedValues).toHaveLength(1); // still 1

      // Reevaluates and emits when the observed flag is changed
      addHandlerSpy.mock.calls[0][1]({ flagsChanged: ['my-flag'] });
      await expect(firstValueFrom(flag$)).resolves.toEqual(value);
      expect(observedValues).toHaveLength(2);
    });

    test('observe a number flag', async () => {
      const value = 42;
      const flag$ = startContract.getNumberValue$('my-flag', value);
      const observedValues: number[] = [];
      flag$.subscribe((v) => observedValues.push(v));
      // Initial emission
      await expect(firstValueFrom(flag$)).resolves.toEqual(value);
      expect(apmSpy).toHaveBeenCalledWith({ 'flag_my-flag': value });
      expect(observedValues).toHaveLength(1);

      // Does not reevaluate and emit if the other flags are changed
      addHandlerSpy.mock.calls[0][1]({ flagsChanged: ['another-flag'] });
      await expect(firstValueFrom(flag$)).resolves.toEqual(value);
      expect(observedValues).toHaveLength(1); // still 1

      // Reevaluates and emits when the observed flag is changed
      addHandlerSpy.mock.calls[0][1]({ flagsChanged: ['my-flag'] });
      await expect(firstValueFrom(flag$)).resolves.toEqual(value);
      expect(observedValues).toHaveLength(2);
    });

    test('with overrides', async () => {
      const getBooleanValueSpy = jest.spyOn(featureFlagsClient, 'getBooleanValue');
      await expect(startContract.getBooleanValue('my-overridden-flag', false)).resolves.toEqual(
        true
      );
      expect(apmSpy).toHaveBeenCalledWith({ 'flag_my-overridden-flag': true });
      expect(getBooleanValueSpy).not.toHaveBeenCalled();

      // Only to prove the spy works
      await expect(startContract.getBooleanValue('another-flag', false)).resolves.toEqual(false);
      expect(getBooleanValueSpy).toHaveBeenCalledTimes(1);
      expect(getBooleanValueSpy).toHaveBeenCalledWith('another-flag', false);
    });

    test('observe a number flag with overrides', async () => {
      const flag$ = startContract.getBooleanValue$('my-overridden-flag', false);
      const observedValues: boolean[] = [];
      flag$.subscribe((v) => observedValues.push(v));
      // Initial emission
      await expect(firstValueFrom(flag$)).resolves.toEqual(true);
      expect(apmSpy).toHaveBeenCalledWith({ 'flag_my-overridden-flag': true });
      expect(observedValues).toHaveLength(1);

      // Does not reevaluate and emit if the other flags are changed
      config$.next({
        overrides: {
          'my-overridden-flag': true,
          'myPlugin.myOverriddenFlag': false,
        },
      });
      await expect(firstValueFrom(flag$)).resolves.toEqual(true);
      expect(observedValues).toHaveLength(1); // still 1

      // Reevaluates and emits when the observed flag is changed
      config$.next({
        overrides: {
          'my-overridden-flag': false,
          'myPlugin.myOverriddenFlag': false,
        },
      });
      await expect(firstValueFrom(flag$)).resolves.toEqual(false);
      expect(observedValues).toHaveLength(2);
      expect(observedValues).toStrictEqual([true, false]);

      // Reevaluates and emits when the observed flag is changed (removed)
      config$.next({
        overrides: {
          'myPlugin.myOverriddenFlag': false,
        },
      });
      await expect(firstValueFrom(flag$)).resolves.toEqual(false);
      expect(observedValues).toHaveLength(3);
      expect(observedValues).toStrictEqual([true, false, false]);
    });

    test('overrides with dotted names', async () => {
      const getBooleanValueSpy = jest.spyOn(featureFlagsClient, 'getBooleanValue');
      await expect(
        startContract.getBooleanValue('myPlugin.myOverriddenFlag', false)
      ).resolves.toEqual(true);
      await expect(
        startContract.getBooleanValue('myDestructuredObjPlugin.myOverriddenFlag', false)
      ).resolves.toEqual(true);
      expect(getBooleanValueSpy).not.toHaveBeenCalled();
    });
  });

  test('returns overrides', () => {
    const { getOverrides } = featureFlagsService.setup();
    expect(getOverrides()).toStrictEqual({
      'my-overridden-flag': true,
      'myPlugin.myOverriddenFlag': true,
      'myDestructuredObjPlugin.myOverriddenFlag': true,
    });
  });

  describe('bootstrapping helpers', () => {
    test('return empty initial feature flags if no getter registered', async () => {
      const { getInitialFeatureFlags } = featureFlagsService.setup();
      await expect(getInitialFeatureFlags()).resolves.toEqual({});
    });

    test('calls the getter when registered', async () => {
      const { setInitialFeatureFlagsGetter, getInitialFeatureFlags } = featureFlagsService.setup();
      const mockGetter = jest.fn().mockResolvedValue({ myFlag: true });
      setInitialFeatureFlagsGetter(mockGetter);
      await expect(getInitialFeatureFlags()).resolves.toEqual({ myFlag: true });
      expect(mockGetter).toHaveBeenCalledTimes(1);
    });
  });
});
