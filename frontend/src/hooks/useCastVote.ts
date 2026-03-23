import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { messagesQueryKey } from './useMessages';
import { MessageListResponse, PollData } from '../types/messages';

interface CastVoteParams {
  groupId: string;
  pollId: string;
  optionIds: string[];
}

async function castVote(
  accessToken: string,
  groupId: string,
  pollId: string,
  optionIds: string[],
): Promise<PollData> {
  const response = await fetch(
    `/api/groups/${groupId}/polls/${pollId}/vote`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ optionIds }),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to cast vote');
  }

  return response.json();
}

export function useCastVote() {
  const { session, user } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token;

  return useMutation({
    mutationFn: ({ groupId, pollId, optionIds }: CastVoteParams) =>
      castVote(accessToken!, groupId, pollId, optionIds),

    onMutate: async ({ groupId, pollId, optionIds }) => {
      const queryKey = messagesQueryKey(groupId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<InfiniteData<MessageListResponse>>(queryKey);

      if (previous && user) {
        queryClient.setQueryData<InfiniteData<MessageListResponse>>(queryKey, {
          ...previous,
          pages: previous.pages.map((page) => ({
            ...page,
            messages: page.messages.map((msg) => {
              if (msg.type !== 'poll' || !msg.pollData || msg.pollData.id !== pollId) return msg;

              const updatedOptions = msg.pollData.options.map((opt) => {
                const wasVoted = opt.hasVoted;
                const isNowVoted = optionIds.includes(opt.id);

                return {
                  ...opt,
                  hasVoted: isNowVoted,
                  voteCount: opt.voteCount + (isNowVoted ? 1 : 0) - (wasVoted ? 1 : 0),
                };
              });

              return {
                ...msg,
                pollData: { ...msg.pollData, options: updatedOptions },
              };
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
