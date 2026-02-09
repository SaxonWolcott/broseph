import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { PendingPromptsResponse } from '../types/prompts';

export const PROMPTS_TODO_QUERY_KEY = ['prompts', 'todo'];

async function fetchPromptsToDo(accessToken: string): Promise<PendingPromptsResponse> {
  const response = await fetch('/api/prompts/todo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch prompts');
  }

  return response.json();
}

export function usePromptsToDo() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token;

  const query = useQuery({
    queryKey: PROMPTS_TODO_QUERY_KEY,
    queryFn: () => fetchPromptsToDo(accessToken!),
    enabled: !!accessToken,
    staleTime: Infinity,
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: PROMPTS_TODO_QUERY_KEY });
  };

  return {
    ...query,
    refetch,
  };
}
