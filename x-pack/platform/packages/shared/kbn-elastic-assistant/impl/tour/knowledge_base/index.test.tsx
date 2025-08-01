/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { EuiTourStepProps } from '@elastic/eui';
import useLocalStorage from 'react-use/lib/useLocalStorage';
import { KnowledgeBaseTour } from '.';
import { TestProviders } from '../../mock/test_providers/test_providers';
import { useAssistantContext } from '../../..';
import { KNOWLEDGE_BASE_TAB } from '../../assistant/settings/const';
import { SecurityPageName } from '@kbn/deeplinks-security';
jest.mock('../../..');
jest.mock('react-use/lib/useLocalStorage');
jest.mock('@elastic/eui', () => {
  const original = jest.requireActual('@elastic/eui');
  return {
    ...original,
    EuiTourStep: ({ children, footerAction, panelProps }: EuiTourStepProps) =>
      children ? (
        <div data-test-subj={panelProps?.['data-test-subj']}>
          {children}
          {(Array.isArray(footerAction) ? footerAction : [footerAction])?.map((action, i) => (
            <span key={i}>{action}</span>
          ))}
        </div>
      ) : (
        <div data-test-subj={panelProps?.['data-test-subj']} />
      ),
  };
});

describe('Attack discovery tour', () => {
  const persistToLocalStorage = jest.fn();
  const navigateToApp = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    (useAssistantContext as jest.Mock).mockReturnValue({
      navigateToApp,
      assistantAvailability: { hasSearchAILakeConfigurations: false },
    });
    jest.mocked(useLocalStorage).mockReturnValue([
      {
        currentTourStep: 1,
        isTourActive: true,
      },
      persistToLocalStorage,
    ] as unknown as ReturnType<typeof useLocalStorage>);
  });

  it('should not render any tour steps when tour is not activated', () => {
    jest.mocked(useLocalStorage).mockReturnValue([
      {
        currentTourStep: 1,
        isTourActive: false,
      },
      persistToLocalStorage,
    ] as unknown as ReturnType<typeof useLocalStorage>);
    render(
      <KnowledgeBaseTour>
        <h1>{'Hello world'}</h1>
      </KnowledgeBaseTour>,
      {
        wrapper: TestProviders,
      }
    );
    expect(screen.queryByTestId('knowledgeBase-tour-step-1')).toBeNull();
    expect(screen.queryByTestId('knowledgeBase-tour-step-2')).toBeNull();
  });

  it('should not render any tour steps when tour is on step 2 and page is not knowledge base', () => {
    jest.mocked(useLocalStorage).mockReturnValue([
      {
        currentTourStep: 2,
        isTourActive: true,
      },
      persistToLocalStorage,
    ] as unknown as ReturnType<typeof useLocalStorage>);
    render(
      <KnowledgeBaseTour>
        <h1>{'Hello world'}</h1>
      </KnowledgeBaseTour>,
      {
        wrapper: TestProviders,
      }
    );
    expect(screen.queryByTestId('knowledgeBase-tour-step-1')).toBeNull();
  });

  it('should render tour step 1 when element is mounted', async () => {
    const { getByTestId } = render(
      <KnowledgeBaseTour>
        <h1>{'Hello world'}</h1>
      </KnowledgeBaseTour>,
      {
        wrapper: TestProviders,
      }
    );

    expect(getByTestId('knowledgeBase-tour-step-1')).toBeInTheDocument();
  });

  it('should go to stack management kb settings', async () => {
    const { getByTestId } = render(
      <KnowledgeBaseTour>
        <h1>{'Hello world'}</h1>
      </KnowledgeBaseTour>,
      {
        wrapper: TestProviders,
      }
    );
    fireEvent.click(getByTestId('tryKb'));
    expect(navigateToApp).toHaveBeenCalledWith('management', {
      path: `kibana/securityAiAssistantManagement?tab=${KNOWLEDGE_BASE_TAB}`,
    });
  });

  it('should go to ai4dsoc kb settings', async () => {
    (useAssistantContext as jest.Mock).mockReturnValue({
      navigateToApp,
      assistantAvailability: { hasSearchAILakeConfigurations: true },
    });
    const { getByTestId } = render(
      <KnowledgeBaseTour>
        <h1>{'Hello world'}</h1>
      </KnowledgeBaseTour>,
      {
        wrapper: TestProviders,
      }
    );
    fireEvent.click(getByTestId('tryKb'));
    expect(navigateToApp).toHaveBeenCalledWith('securitySolutionUI', {
      deepLinkId: SecurityPageName.configurationsAiSettings,
      path: `?tab=${KNOWLEDGE_BASE_TAB}`,
      openInNewTab: true,
    });
  });

  it('should render tour video when tour is on step 2 and page is knowledge base', () => {
    jest.mocked(useLocalStorage).mockReturnValue([
      {
        currentTourStep: 2,
        isTourActive: true,
      },
      persistToLocalStorage,
    ] as unknown as ReturnType<typeof useLocalStorage>);
    const { getByTestId } = render(<KnowledgeBaseTour isKbSettingsPage />, {
      wrapper: TestProviders,
    });
    expect(screen.queryByTestId('knowledgeBase-tour-step-1')).toBeNull();
    expect(getByTestId('knowledgeBase-tour-step-2')).toBeInTheDocument();
  });

  it('should advance to tour step 2 when page is knowledge base', () => {
    render(<KnowledgeBaseTour isKbSettingsPage />, { wrapper: TestProviders });
    const nextStep = persistToLocalStorage.mock.calls[0][0];
    expect(nextStep()).toEqual({ isTourActive: true, currentTourStep: 2 });
  });
});
