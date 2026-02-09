import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Message, MessageListResponse, SendMessageRequest } from '../types/messages';
import { JobAcceptedResponse } from '../types/groups';
import { messagesQueryKey } from './useMessages';

async function sendMessage(
  accessToken: string,
  groupId: string,
  content: string,
): Promise<JobAcceptedResponse> {
  const response = await fetch(`/api/groups/${groupId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content } satisfies SendMessageRequest),
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
}

/**
 * Hook to send a message with optimistic updates.
 */
export function useSendMessage() {
  const { session, user } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token;

  return useMutation({
    mutationFn: ({ groupId, content }: SendMessageParams) =>
      sendMessage(accessToken!, groupId, content),

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

    onSettled: (_data, _error, { groupId }) => {
      // Refetch to get the real message
      queryClient.invalidateQueries({ queryKey: messagesQueryKey(groupId) });
    },
  });
}
