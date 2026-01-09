import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { CreateInviteRequest, InviteCreatedResponse } from '../types/invites';

async function createInvite(
  accessToken: string,
  groupId: string,
  data?: CreateInviteRequest,
): Promise<InviteCreatedResponse> {
  const response = await fetch(`/api/groups/${groupId}/invites`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data ?? {}),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create invite');
  }

  return response.json();
}

interface CreateInviteParams {
  groupId: string;
  email?: string;
}

/**
 * Hook to create an invite link for a group.
 */
export function useCreateInvite() {
  const { session } = useAuth();
  const accessToken = session?.access_token;

  return useMutation({
    mutationFn: ({ groupId, email }: CreateInviteParams) =>
      createInvite(accessToken!, groupId, email ? { email } : undefined),
  });
}
