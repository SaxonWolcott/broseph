import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { messagesQueryKey } from './useMessages';
import { PollData } from '../types/messages';

interface ClosePollParams {
  groupId: string;
  pollId: string;
}

async function closePoll(
  accessToken: string,
  groupId: string,
  pollId: string,
): Promise<PollData> {
  const response = await fetch(
    `/api/groups/${groupId}/polls/${pollId}/close`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to close poll');
  }

  return response.json();
}

export function useClosePoll() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token;

  return useMutation({
    mutationFn: ({ groupId, pollId }: ClosePollParams) =>
      closePoll(accessToken!, groupId, pollId),

    onSettled: (_data, _error, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: messagesQueryKey(groupId) });
    },
  });
}
