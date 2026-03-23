import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { messagesQueryKey } from './useMessages';
import { PollData } from '../types/messages';

interface AddPollOptionParams {
  groupId: string;
  pollId: string;
  text: string;
}

async function addPollOption(
  accessToken: string,
  groupId: string,
  pollId: string,
  text: string,
): Promise<PollData> {
  const response = await fetch(
    `/api/groups/${groupId}/polls/${pollId}/options`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to add option');
  }

  return response.json();
}

export function useAddPollOption() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token;

  return useMutation({
    mutationFn: ({ groupId, pollId, text }: AddPollOptionParams) =>
      addPollOption(accessToken!, groupId, pollId, text),

    onSettled: (_data, _error, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: messagesQueryKey(groupId) });
    },
  });
}
