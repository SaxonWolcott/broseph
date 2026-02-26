import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { MessageListResponse, ToggleReactionResponse } from '../types/messages';
import { messagesQueryKey } from './useMessages';

async function putReaction(
  accessToken: string,
  groupId: string,
  messageId: string,
  emoji: string,
): Promise<ToggleReactionResponse> {
  const response = await fetch(
    `/api/groups/${groupId}/messages/${messageId}/reactions`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emoji }),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to toggle reaction');
  }

  return response.json();
}

interface ToggleReactionParams {
  groupId: string;
  messageId: string;
  emoji: string;
}

export function useToggleReaction() {
  const { session, user } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token;

  return useMutation({
    mutationFn: ({ groupId, messageId, emoji }: ToggleReactionParams) =>
      putReaction(accessToken!, groupId, messageId, emoji),

    onMutate: async ({ groupId, messageId, emoji }) => {
      const queryKey = messagesQueryKey(groupId);
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<InfiniteData<MessageListResponse>>(queryKey);

      if (previous && user) {
        queryClient.setQueryData<InfiniteData<MessageListResponse>>(queryKey, {
          ...previous,
          pages: previous.pages.map((page) => ({
            ...page,
            messages: page.messages.map((msg) => {
              if (msg.id !== messageId) return msg;

              const reactions = [...(msg.reactions || [])];
              const idx = reactions.findIndex((r) => r.emoji === emoji);

              if (idx >= 0) {
                const r = reactions[idx];
                if (r.hasReacted) {
                  // Remove our reaction
                  if (r.count <= 1) {
                    reactions.splice(idx, 1);
                  } else {
                    reactions[idx] = { ...r, count: r.count - 1, hasReacted: false };
                  }
                } else {
                  // Add our reaction
                  reactions[idx] = { ...r, count: r.count + 1, hasReacted: true };
                }
              } else {
                // New emoji
                reactions.push({ emoji, count: 1, hasReacted: true });
              }

              return { ...msg, reactions: reactions.length > 0 ? reactions : null };
            }),
          })),
        });
      }

      return { previous, groupId };
    },

    onError: (_err, { groupId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(messagesQueryKey(groupId), context.previous);
      }
    },

    onSettled: (_data, _error, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: messagesQueryKey(groupId) });
    },
  });
}
