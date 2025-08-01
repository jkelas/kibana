/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiResizableContainer, useEuiScrollBar } from '@elastic/eui';
import { css } from '@emotion/react';
import React, { useCallback, useEffect, useRef } from 'react';
import { useConversation } from '../../hooks/use_conversation';
import { useSendMessageMutation } from '../../hooks/use_send_message_mutation';
import { useStickToBottom } from '../../hooks/use_stick_to_bottom';
import { ConversationInputForm } from './conversation_input/conversation_input_form';
import { ConversationRounds } from './conversation_rounds/conversation_rounds';
import { NewConversationPrompt } from './new_conversation_prompt';

const fullHeightStyles = css`
  height: 100%;
`;
const conversationContainerStyles = css`
  ${fullHeightStyles}
  width: 100%;
`;

export const Conversation: React.FC<{}> = () => {
  const { conversationId, hasActiveConversation } = useConversation();
  const { sendMessage, isResponseLoading, isResponseError, responseError } =
    useSendMessageMutation();

  const scrollContainerStyles = css`
    overflow-y: auto;
    ${fullHeightStyles}
    ${useEuiScrollBar()}
  `;
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const { setStickToBottom } = useStickToBottom({
    defaultState: true,
    scrollContainer: scrollContainerRef.current,
  });

  useEffect(() => {
    setStickToBottom(true);
  }, [conversationId, setStickToBottom]);

  const onSubmit = useCallback(
    (message: string) => {
      if (isResponseLoading) {
        return;
      }
      sendMessage({ message });
      setStickToBottom(true);
    },
    [isResponseLoading, sendMessage, setStickToBottom]
  );

  return (
    <EuiResizableContainer direction="vertical" css={conversationContainerStyles}>
      {(EuiResizablePanel, EuiResizableButton) => {
        return (
          <>
            {hasActiveConversation ? (
              <EuiResizablePanel initialSize={80}>
                <div css={scrollContainerStyles}>
                  <div ref={scrollContainerRef}>
                    <ConversationRounds
                      isResponseLoading={isResponseLoading}
                      isResponseError={isResponseError}
                      responseError={responseError}
                    />
                  </div>
                </div>
              </EuiResizablePanel>
            ) : (
              <EuiResizablePanel initialSize={80}>
                <div css={fullHeightStyles}>
                  <NewConversationPrompt />
                </div>
              </EuiResizablePanel>
            )}
            <EuiResizableButton />
            <EuiResizablePanel initialSize={20} minSize="20%">
              <ConversationInputForm onSubmit={onSubmit} />
            </EuiResizablePanel>
          </>
        );
      }}
    </EuiResizableContainer>
  );
};
