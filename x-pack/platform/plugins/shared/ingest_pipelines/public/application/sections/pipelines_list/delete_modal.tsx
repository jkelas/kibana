/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiConfirmModal, EuiSpacer, EuiBadge, useGeneratedHtmlId } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';

import { DeleteManagedAssetsCallout } from '@kbn/delete-managed-asset-callout';
import { Pipeline } from '../../../../common/types';
import { useKibana } from '../../../shared_imports';

export const PipelineDeleteModal = ({
  pipelinesToDelete,
  callback,
}: {
  pipelinesToDelete: Pipeline[];
  callback: (data?: { hasDeletedPipelines: boolean }) => void;
}) => {
  const { services } = useKibana();

  const numPipelinesToDelete = pipelinesToDelete.length;
  const managedPipelinesToDelete = pipelinesToDelete.filter(({ isManaged }) => isManaged).length;

  const handleDeletePipelines = () => {
    const pipelineNames = pipelinesToDelete.map(({ name }) => name);

    services.api
      .deletePipelines(pipelineNames)
      .then(({ data: { itemsDeleted, errors }, error }) => {
        const hasDeletedPipelines = itemsDeleted && itemsDeleted.length;

        if (hasDeletedPipelines) {
          const successMessage =
            itemsDeleted.length === 1
              ? i18n.translate(
                  'xpack.ingestPipelines.deleteModal.successDeleteSingleNotificationMessageText',
                  {
                    defaultMessage: "Deleted pipeline ''{pipelineName}''",
                    values: { pipelineName: pipelineNames[0] },
                  }
                )
              : i18n.translate(
                  'xpack.ingestPipelines.deleteModal.successDeleteMultipleNotificationMessageText',
                  {
                    defaultMessage:
                      'Deleted {numSuccesses, plural, one {# pipeline} other {# pipelines}}',
                    values: { numSuccesses: itemsDeleted.length },
                  }
                );

          callback({ hasDeletedPipelines });
          services.notifications.toasts.addSuccess(successMessage);
        }

        if (error || errors?.length) {
          const hasMultipleErrors = errors?.length > 1 || (error && pipelinesToDelete.length > 1);
          const errorMessage = hasMultipleErrors
            ? i18n.translate(
                'xpack.ingestPipelines.deleteModal.multipleErrorsNotificationMessageText',
                {
                  defaultMessage: 'Error deleting {count} pipelines',
                  values: {
                    count: errors?.length || pipelinesToDelete.length,
                  },
                }
              )
            : i18n.translate('xpack.ingestPipelines.deleteModal.errorNotificationMessageText', {
                defaultMessage: "Error deleting pipeline ''{name}''",
                values: { name: (errors && errors[0].name) || pipelineNames[0] },
              });
          services.notifications.toasts.addDanger(errorMessage);
        }
      });
  };

  const handleOnCancel = () => {
    callback();
  };

  const modalTitleId = useGeneratedHtmlId();

  return (
    <EuiConfirmModal
      aria-labelledby={modalTitleId}
      buttonColor="danger"
      data-test-subj="deletePipelinesConfirmation"
      titleProps={{ id: modalTitleId }}
      title={
        <FormattedMessage
          id="xpack.ingestPipelines.deleteModal.modalTitleText"
          defaultMessage="Delete {numPipelinesToDelete, plural, one {pipeline} other {# pipelines}}"
          values={{ numPipelinesToDelete }}
        />
      }
      onCancel={handleOnCancel}
      onConfirm={handleDeletePipelines}
      cancelButtonText={
        <FormattedMessage
          id="xpack.ingestPipelines.deleteModal.cancelButtonLabel"
          defaultMessage="Cancel"
        />
      }
      confirmButtonText={
        <FormattedMessage
          id="xpack.ingestPipelines.deleteModal.confirmButtonLabel"
          defaultMessage="Delete {numPipelinesToDelete, plural, one {pipeline} other {pipelines} }"
          values={{ numPipelinesToDelete }}
        />
      }
    >
      <>
        {managedPipelinesToDelete > 0 && (
          <>
            <DeleteManagedAssetsCallout
              assetName={i18n.translate('xpack.ingestPipelines.deleteModal.assetName', {
                defaultMessage: 'ingest pipelines',
              })}
            />

            <EuiSpacer size="m" />
          </>
        )}

        <p>
          <FormattedMessage
            id="xpack.ingestPipelines.deleteModal.deleteDescription"
            defaultMessage="You are about to delete {numPipelinesToDelete, plural, one {this pipeline} other {these pipelines} }:"
            values={{ numPipelinesToDelete }}
          />
        </p>

        <ul>
          {pipelinesToDelete.map(({ name, isManaged }) => (
            <li key={name}>
              {name}{' '}
              {isManaged && (
                <EuiBadge color="hollow">
                  {i18n.translate('xpack.ingestPipelines.deleteModal.managedPipelineLabel', {
                    defaultMessage: 'Managed',
                  })}
                </EuiBadge>
              )}
            </li>
          ))}
        </ul>
      </>
    </EuiConfirmModal>
  );
};
