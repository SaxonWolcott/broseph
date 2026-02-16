import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Message, MessageListResponse, SendMessageRequest } from '../types/messages';
import { JobAcceptedResponse } from '../types/groups';
import { messagesQueryKey } from './useMessages';

async function sendMessage(
  accessToken: string,
  groupId: string,
  content: string,
  promptResponseId?: string,
  replyInChat?: boolean,
  replyToId?: string,
): Promise<JobAcceptedResponse> {
  const body: SendMessageRequest = { content };
  if (promptResponseId) {
    body.promptResponseId = promptResponseId;
    body.replyInChat = replyInChat;
  }
  if (replyToId) {
    body.replyToId = replyToId;
  }

  const response = await fetch(`/api/groups/${groupId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to send message');
  }

  return response.json();
}

interface SendMessageParams {
  groupId: string;
  content: string;
  promptResponseId?: string;
  replyInChat?: boolean;
  replyToId?: string;
}

/**
 * Hook to send a message with optimistic updates.
 */
export function useSendMessage() {
  const { session, user } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token;

  return useMutation({
    mutationFn: ({ groupId, content, promptResponseId, replyInChat, replyToId }: SendMessageParams) =>
      sendMessage(accessToken!, groupId, content, promptResponseId, replyInChat, replyToId),

    onMutate: async ({ groupId, content }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: messagesQueryKey(groupId) });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<
        InfiniteData<MessageListResponse>
      >(messagesQueryKey(groupId));

      // Optimistically update
      if (previousMessages && user) {
        const optimisticMessage: Message = {
          id: `temp-${Date.now()}`,
          groupId,
          sender: {
            id: user.id,
            displayName: user.user_metadata?.display_name ?? null,
            handle: user.user_metadata?.handle ?? null,
            avatarUrl: user.user_metadata?.avatar_url ?? null,
          },
          content,
          type: 'message',
          createdAt: new Date().toISOString(),
          pending: true,
        };

        queryClient.setQueryData<InfiniteData<MessageListResponse>>(
          messagesQueryKey(groupId),
          {
            ...previousMessages,
            pages: previousMessages.pages.map((page, index) => {
              if (index === 0) {
                return {
                  ...page,
                  messages: [optimisticMessage, ...page.messages],
                };
              }
              return page;
            }),
          },
        );
      }

      return { previousMessages, groupId };
    },

    onError: (_err, { groupId }, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          messagesQueryKey(groupId),
          context.previousMessages,
        );
      }
    },

    onSettled: (_data, _error, { groupId, promptResponseId }) => {
      // Refetch to get the real message
      queryClient.invalidateQueries({ queryKey: messagesQueryKey(groupId) });
      // Invalidate reply cache if this was a reply
      if (promptResponseId) {
        queryClient.invalidateQueries({ queryKey: ['prompts', 'responses', promptResponseId, 'replies'] });
        // Also invalidate the prompt data so reply counts update
        queryClient.invalidateQueries({ queryKey: ['prompts', 'group'] });
      }
    },
  });
}
