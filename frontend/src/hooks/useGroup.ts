import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { GroupDetail } from '../types/groups';

export const groupQueryKey = (groupId: string) => ['groups', groupId];

async function fetchGroup(
  accessToken: string,
  groupId: string,
): Promise<GroupDetail> {
  const response = await fetch(`/api/groups/${groupId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch group');
  }

  return response.json();
}

/**
 * Hook to fetch a single group's details.
 */
export function useGroup(groupId: string | undefined) {
  const { session } = useAuth();
  const accessToken = session?.access_token;

  return useQuery({
    queryKey: groupQueryKey(groupId!),
    queryFn: () => fetchGroup(accessToken!, groupId!),
    enabled: !!accessToken && !!groupId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
