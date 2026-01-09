import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { JobAcceptedResponse } from '../types/groups';
import { GROUPS_QUERY_KEY } from './useGroups';

async function leaveGroup(
  accessToken: string,
  groupId: string,
): Promise<JobAcceptedResponse> {
  const response = await fetch(`/api/groups/${groupId}/members/me`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to leave group');
  }

  return response.json();
}

/**
 * Hook to leave a group.
 */
export function useLeaveGroup() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token;

  return useMutation({
    mutationFn: (groupId: string) => leaveGroup(accessToken!, groupId),
    onSuccess: () => {
      // Invalidate groups list to remove the group
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
    },
  });
}
