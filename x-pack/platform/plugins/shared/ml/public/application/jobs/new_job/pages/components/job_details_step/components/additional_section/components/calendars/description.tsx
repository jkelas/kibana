/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { FC, PropsWithChildren } from 'react';
import React, { memo } from 'react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { EuiDescribedFormGroup, EuiFormRow, EuiLink } from '@elastic/eui';
import { useMlKibana } from '../../../../../../../../../contexts/kibana';

interface Props {
  titleId: string;
}

export const Description: FC<PropsWithChildren<Props>> = memo(({ children, titleId }) => {
  const {
    services: { docLinks },
  } = useMlKibana();
  const docsUrl = docLinks.links.ml.calendars;
  const title = i18n.translate(
    'xpack.ml.newJob.wizard.jobDetailsStep.additionalSection.calendarsSelection.title',
    {
      defaultMessage: 'Calendars',
    }
  );
  return (
    <EuiDescribedFormGroup
      title={<h3 id={titleId}>{title}</h3>}
      description={
        <FormattedMessage
          id="xpack.ml.newJob.wizard.jobDetailsStep.additionalSection.calendarsSelection.description"
          defaultMessage="A list of scheduled events you want to ignore, such as planned system outages or public holidays. {learnMoreLink}"
          values={{
            learnMoreLink: (
              <EuiLink href={docsUrl} target="_blank">
                <FormattedMessage
                  id="xpack.ml.newJob.wizard.jobDetailsStep.additionalSection.calendarsSelection.learnMoreLinkText"
                  defaultMessage="Learn more"
                />
              </EuiLink>
            ),
          }}
        />
      }
    >
      <EuiFormRow>
        <>{children}</>
      </EuiFormRow>
    </EuiDescribedFormGroup>
  );
});
