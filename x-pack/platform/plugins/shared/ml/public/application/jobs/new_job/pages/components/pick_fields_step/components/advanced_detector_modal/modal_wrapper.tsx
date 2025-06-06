/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { FC, PropsWithChildren } from 'react';
import React from 'react';
import { FormattedMessage } from '@kbn/i18n-react';
import {
  EuiButton,
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiButtonEmpty,
  useGeneratedHtmlId,
} from '@elastic/eui';

const MAX_MODAL_WIDTH = 1200;

interface Props {
  onCreateClick(): void;
  closeModal(): void;
  saveEnabled: boolean;
}

export const ModalWrapper: FC<PropsWithChildren<Props>> = ({
  onCreateClick,
  closeModal,
  saveEnabled,
  children,
}) => {
  const titleId = useGeneratedHtmlId({ prefix: 'mlCreateDetectorModalTitle' });
  return (
    <EuiModal
      onClose={closeModal}
      maxWidth={MAX_MODAL_WIDTH}
      data-test-subj="mlCreateDetectorModal"
      aria-labelledby={titleId}
    >
      <EuiModalHeader>
        <EuiModalHeaderTitle id={titleId}>
          <FormattedMessage
            id="xpack.ml.newJob.wizard.pickFieldsStep.advancedDetectorModal.title"
            defaultMessage="Create detector"
          />
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>{children}</EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty onClick={closeModal} data-test-subj="mlCreateDetectorModalCancelButton">
          <FormattedMessage
            id="xpack.ml.newJob.wizard.pickFieldsStep.advancedDetectorModal.cancelButton"
            defaultMessage="Cancel"
          />
        </EuiButtonEmpty>

        <EuiButton
          onClick={onCreateClick}
          isDisabled={saveEnabled === false}
          fill
          data-test-subj="mlCreateDetectorModalSaveButton"
        >
          <FormattedMessage
            id="xpack.ml.newJob.wizard.pickFieldsStep.advancedDetectorModal.saveButton"
            defaultMessage="Save"
          />
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
