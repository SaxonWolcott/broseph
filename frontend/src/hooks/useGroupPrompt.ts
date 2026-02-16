import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { GroupPromptTodayResponse } from '../types/prompts';

async function fetchGroupPromptToday(
  accessToken: string,
  groupId: string,
): Promise<GroupPromptTodayResponse> {
  const response = await fetch(`/api/prompts/group/${groupId}/today`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch prompt');
  }

  return response.json();
}

export function useGroupPrompt(groupId: string | undefined) {
  const { session } = useAuth();
  const accessToken = session?.access_token;

  return useQuery({
    queryKey: ['prompts', 'group', groupId, 'today'],
    queryFn: () => fetchGroupPromptToday(accessToken!, groupId!),
    enabled: !!accessToken && !!groupId,
    staleTime: 60_000,
  });
}
