import { useQuery } from '@tanstack/react-query';
import { InvitePreview } from '../types/invites';

export const invitePreviewQueryKey = (token: string) => ['invites', token];

async function fetchInvitePreview(token: string): Promise<InvitePreview> {
  const response = await fetch(`/api/invites/${token}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Invite not found');
  }

  return response.json();
}

/**
 * Hook to fetch invite preview (public - no auth required).
 */
export function useInvitePreview(token: string | undefined) {
  return useQuery({
    queryKey: invitePreviewQueryKey(token!),
    queryFn: () => fetchInvitePreview(token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Don't retry on 404
  });
}
