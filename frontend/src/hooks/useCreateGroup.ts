import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { CreateGroupRequest, JobAcceptedResponse } from '../types/groups';
import { GROUPS_QUERY_KEY } from './useGroups';

async function createGroup(
  accessToken: string,
  data: CreateGroupRequest,
): Promise<JobAcceptedResponse> {
  const response = await fetch('/api/groups', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create group');
  }

  return response.json();
}

/**
 * Hook to create a new group.
 */
export function useCreateGroup() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token;

  return useMutation({
    mutationFn: (data: CreateGroupRequest) => createGroup(accessToken!, data),
    onSuccess: () => {
      // Invalidate groups list to trigger refetch
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
    },
  });
}
