import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { SubmitPromptRequest } from '../types/prompts';
import { PROMPTS_TODO_QUERY_KEY } from './usePromptsToDo';
import { PROMPT_FEED_QUERY_KEY } from './usePromptFeed';

async function submitResponse(
  accessToken: string,
  data: SubmitPromptRequest,
): Promise<{ id: string; status: string }> {
  const response = await fetch('/api/prompts/respond', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to submit response');
  }

  return response.json();
}

export function useSubmitPromptResponse() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token;

  return useMutation({
    mutationFn: (data: SubmitPromptRequest) => submitResponse(accessToken!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROMPTS_TODO_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PROMPT_FEED_QUERY_KEY });
    },
  });
}
