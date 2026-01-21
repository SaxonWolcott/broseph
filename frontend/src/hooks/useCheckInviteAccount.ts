import { useQuery } from '@tanstack/react-query';

interface CheckAccountResponse {
  hasAccount: boolean;
}

async function checkInviteAccount(
  token: string,
): Promise<CheckAccountResponse> {
  const response = await fetch(`/api/invites/${token}/check-account`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to check account');
  }

  return response.json();
}

/**
 * Hook to check if the invite's email has an existing account.
 * No authentication required.
 */
export function useCheckInviteAccount(token: string | undefined) {
  return useQuery({
    queryKey: ['invite-account', token],
    queryFn: () => checkInviteAccount(token!),
    enabled: !!token,
  });
}
