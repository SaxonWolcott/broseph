import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { messagesQueryKey } from './useMessages';

interface PollSettings {
  allowMultiple?: boolean;
  showVotes?: boolean;
  allowAddOptions?: boolean;
  declareWinnerOnAllVoted?: boolean;
  closesAt?: string;
}

interface CreatePollParams {
  groupId: string;
  title: string;
  options: { text: string }[];
  settings?: PollSettings;
}

async function createPoll(
  accessToken: string,
  groupId: string,
  title: string,
  options: { text: string }[],
  settings?: PollSettings,
): Promise<{ jobId: string; status: string }> {
  const response = await fetch(`/api/groups/${groupId}/polls`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, options, settings }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create poll');
  }

  return response.json();
}

export function useCreatePoll() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token;

  return useMutation({
    mutationFn: ({ groupId, title, options, settings }: CreatePollParams) =>
      createPoll(accessToken!, groupId, title, options, settings),

    onSettled: (_data, _error, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: messagesQueryKey(groupId) });
    },
  });
}
