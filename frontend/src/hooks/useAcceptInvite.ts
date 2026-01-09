import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { AcceptInviteResponse } from '../types/invites';
import { GROUPS_QUERY_KEY } from './useGroups';

async function acceptInvite(
  accessToken: string,
  token: string,
): Promise<AcceptInviteResponse> {
  const response = await fetch(`/api/invites/${token}/accept`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to accept invite');
  }

  return response.json();
}

/**
 * Hook to accept an invite and join a group.
 */
export function useAcceptInvite() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token;

  return useMutation({
    mutationFn: (token: string) => acceptInvite(accessToken!, token),
    onSuccess: () => {
      // Invalidate groups list to show the new group
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
    },
  });
}
