import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { PromptResponseRepliesResponse } from '../types/prompts';

async function fetchReplies(
  accessToken: string,
  responseId: string,
): Promise<PromptResponseRepliesResponse> {
  const response = await fetch(`/api/prompts/responses/${responseId}/replies`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch replies');
  }

  return response.json();
}

export const repliesQueryKey = (responseId: string) => ['prompts', 'responses', responseId, 'replies'];

export function usePromptResponseReplies(responseId: string | undefined) {
  const { session } = useAuth();
  const accessToken = session?.access_token;

  return useQuery({
    queryKey: repliesQueryKey(responseId!),
    queryFn: () => fetchReplies(accessToken!, responseId!),
    enabled: !!accessToken && !!responseId,
    staleTime: 30_000,
  });
}
