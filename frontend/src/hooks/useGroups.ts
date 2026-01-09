import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { GroupListResponse } from '../types/groups';

export const GROUPS_QUERY_KEY = ['groups'];

async function fetchGroups(accessToken: string): Promise<GroupListResponse> {
  const response = await fetch('/api/groups', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch groups');
  }

  return response.json();
}

/**
 * Hook to fetch the user's groups.
 */
export function useGroups() {
  const { session } = useAuth();
  const accessToken = session?.access_token;

  return useQuery({
    queryKey: GROUPS_QUERY_KEY,
    queryFn: () => fetchGroups(accessToken!),
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
