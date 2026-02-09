import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { FeedResponse } from '../types/prompts';

export const PROMPT_FEED_QUERY_KEY = ['prompts', 'feed'];

async function fetchPromptFeed(accessToken: string): Promise<FeedResponse> {
  const response = await fetch('/api/prompts/feed', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch feed');
  }

  return response.json();
}

export function usePromptFeed() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token;

  const query = useQuery({
    queryKey: PROMPT_FEED_QUERY_KEY,
    queryFn: () => fetchPromptFeed(accessToken!),
    enabled: !!accessToken,
    staleTime: Infinity,
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: PROMPT_FEED_QUERY_KEY });
  };

  return {
    ...query,
    refetch,
  };
}
