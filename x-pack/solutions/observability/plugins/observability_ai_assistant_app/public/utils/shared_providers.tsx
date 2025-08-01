/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type { CoreStart, CoreTheme } from '@kbn/core/public';
import { KibanaContextProvider } from '@kbn/kibana-react-plugin/public';
import { KibanaThemeProvider } from '@kbn/react-kibana-context-theme';
import { RedirectAppLinks } from '@kbn/shared-ux-link-redirect-app';
import React, { useMemo } from 'react';
import type { Observable } from 'rxjs';
import { AIAssistantAppService } from '@kbn/ai-assistant';
import type { ObservabilityAIAssistantAppPluginStartDependencies } from '../types';

export function SharedProviders({
  children,
  coreStart,
  pluginsStart,
  service,
  theme$,
}: {
  children: React.ReactElement;
  coreStart: CoreStart;
  pluginsStart: ObservabilityAIAssistantAppPluginStartDependencies;
  service: AIAssistantAppService;
  theme$: Observable<CoreTheme>;
}) {
  const theme = useMemo(() => {
    return { theme$ };
  }, [theme$]);

  return coreStart.rendering.addContext(
    <KibanaThemeProvider theme={theme}>
      <KibanaContextProvider
        services={{
          ...coreStart,
          ...pluginsStart,
          plugins: {
            start: pluginsStart,
          },
        }}
      >
        <RedirectAppLinks coreStart={coreStart}>
          <coreStart.i18n.Context>{children}</coreStart.i18n.Context>
        </RedirectAppLinks>
      </KibanaContextProvider>
    </KibanaThemeProvider>
  );
}
