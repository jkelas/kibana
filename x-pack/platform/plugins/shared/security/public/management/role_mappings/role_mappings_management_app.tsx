/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { useParams } from 'react-router-dom';

import type { StartServicesAccessor } from '@kbn/core/public';
import { i18n } from '@kbn/i18n';
import { KibanaContextProvider } from '@kbn/kibana-react-plugin/public';
import type { RegisterManagementAppArgs } from '@kbn/management-plugin/public';
import { Route, Router } from '@kbn/shared-ux-router';

import {
  Breadcrumb,
  BreadcrumbsProvider,
  createBreadcrumbsChangeHandler,
} from '../../components/breadcrumb';
import type { PluginStartDependencies } from '../../plugin';
import { ReadonlyBadge } from '../badges/readonly_badge';
import { tryDecodeURIComponent } from '../url_utils';

interface CreateParams {
  getStartServices: StartServicesAccessor<PluginStartDependencies>;
}

export const roleMappingsManagementApp = Object.freeze({
  id: 'role_mappings',
  create({ getStartServices }: CreateParams) {
    const title = i18n.translate('xpack.security.management.roleMappingsTitle', {
      defaultMessage: 'Role Mappings',
    });

    return {
      id: this.id,
      order: 40,
      title,
      async mount({ element, setBreadcrumbs, history }) {
        const [
          [core],
          { RoleMappingsGridPage },
          { EditRoleMappingPage },
          { RoleMappingsAPIClient },
          { RolesAPIClient },
          { SecurityFeaturesAPIClient },
        ] = await Promise.all([
          getStartServices(),
          import('./role_mappings_grid'),
          import('./edit_role_mapping'),
          import('./role_mappings_api_client'),
          import('../roles'),
          import('../security_features'),
        ]);

        core.chrome.docTitle.change(title);

        const roleMappingsAPIClient = new RoleMappingsAPIClient(core.http);
        const securityFeaturesAPIClient = new SecurityFeaturesAPIClient(core.http);

        const EditRoleMappingsPageWithBreadcrumbs = ({ action }: { action: 'edit' | 'clone' }) => {
          const { name } = useParams<{ name?: string }>();

          // Additional decoding is a workaround for a bug in react-router's version of the `history` module.
          // See https://github.com/elastic/kibana/issues/82440
          const decodedName = name ? tryDecodeURIComponent(name) : undefined;

          const breadcrumbObj =
            action === 'edit' && name && decodedName
              ? { text: decodedName, href: `/edit/${encodeURIComponent(name)}` }
              : {
                  text: i18n.translate('xpack.security.roleMappings.createBreadcrumb', {
                    defaultMessage: 'Create',
                  }),
                };

          return (
            <Breadcrumb text={breadcrumbObj.text} href={breadcrumbObj.href}>
              <EditRoleMappingPage
                action={action}
                name={decodedName}
                roleMappingsAPI={roleMappingsAPIClient}
                securityFeaturesAPI={securityFeaturesAPIClient}
                rolesAPIClient={new RolesAPIClient(core.http)}
                notifications={core.notifications}
                docLinks={core.docLinks}
                history={history}
                readOnly={!core.application.capabilities.role_mappings.save}
              />
            </Breadcrumb>
          );
        };

        render(
          core.rendering.addContext(
            <KibanaContextProvider services={core}>
              <Router history={history}>
                <ReadonlyBadge
                  data-test-subj="readOnlyBadge"
                  featureId="role_mappings"
                  tooltip={i18n.translate(
                    'xpack.security.management.roleMappings.readonlyTooltip',
                    {
                      defaultMessage: 'Unable to create or edit role mappings',
                    }
                  )}
                />
                <BreadcrumbsProvider
                  onChange={createBreadcrumbsChangeHandler(core.chrome, setBreadcrumbs)}
                >
                  <Breadcrumb text={title} href="/">
                    <Route path={['/', '']} exact={true}>
                      <RoleMappingsGridPage
                        notifications={core.notifications}
                        rolesAPIClient={new RolesAPIClient(core.http)}
                        roleMappingsAPI={roleMappingsAPIClient}
                        securityFeaturesAPI={securityFeaturesAPIClient}
                        docLinks={core.docLinks}
                        history={history}
                        navigateToApp={core.application.navigateToApp}
                        readOnly={!core.application.capabilities.role_mappings.save}
                      />
                    </Route>
                    <Route path="/edit/:name?">
                      <EditRoleMappingsPageWithBreadcrumbs action="edit" />
                    </Route>
                    <Route path="/clone/:name">
                      <EditRoleMappingsPageWithBreadcrumbs action="clone" />
                    </Route>
                  </Breadcrumb>
                </BreadcrumbsProvider>
              </Router>
            </KibanaContextProvider>
          ),
          element
        );

        return () => {
          unmountComponentAtNode(element);
        };
      },
    } as RegisterManagementAppArgs;
  },
});
