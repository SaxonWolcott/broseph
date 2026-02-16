import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { SubmitPromptRequest } from '../types/prompts';

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
    onSuccess: (_data, variables) => {
      // Invalidate the group-specific prompt query so the UI updates
      queryClient.invalidateQueries({ queryKey: ['prompts', 'group', variables.groupId, 'today'] });
      // Invalidate messages so the new prompt_response message appears in chat
      queryClient.invalidateQueries({ queryKey: ['groups', variables.groupId, 'messages'] });
    },
  });
}
