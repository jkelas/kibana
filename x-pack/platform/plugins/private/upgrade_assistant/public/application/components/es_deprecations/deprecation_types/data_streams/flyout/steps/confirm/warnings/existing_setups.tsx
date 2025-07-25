/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { FormattedMessage } from '@kbn/i18n-react';
import { WarningCheckbox, WarningCheckboxProps } from './warning_step_checkbox';

export const AffectExistingSetupsWarningCheckbox: React.FunctionComponent<WarningCheckboxProps> = ({
  isChecked,
  onChange,
  id,
  meta,
}) => {
  return (
    <WarningCheckbox
      isChecked={isChecked}
      onChange={onChange}
      warningId={id}
      label={
        <FormattedMessage
          tagName="b"
          id="xpack.upgradeAssistant.dataStream.migration.flyout.warningsStep.affectExistingSetupsWarningLabel"
          defaultMessage="Set to read-only all incompatible data for this data stream"
        />
      }
      dataStreamName={meta?.dataStreamName}
      description={
        meta &&
        typeof meta.indicesRequiringUpgradeCount === 'number' &&
        meta.indicesRequiringUpgradeCount > 0 && (
          <FormattedMessage
            tagName="p"
            id="xpack.upgradeAssistant.dataStream.modal.confirmStep.readonly.acceptChangesTitle"
            defaultMessage="{count, plural, =1 {# backing index} other {# backing indices}}, including current write index, will be set to read-only."
            values={{
              count: meta.indicesRequiringUpgradeCount,
            }}
          />
        )
      }
      data-test-subj="affectExistingSetupsWarningCheckbox"
    />
  );
};
