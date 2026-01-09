import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { GroupMember } from '../types/groups';

export const groupMembersQueryKey = (groupId: string) => [
  'groups',
  groupId,
  'members',
];

interface MembersResponse {
  members: GroupMember[];
}

async function fetchGroupMembers(
  accessToken: string,
  groupId: string,
): Promise<GroupMember[]> {
  const response = await fetch(`/api/groups/${groupId}/members`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch members');
  }

  const data: MembersResponse = await response.json();
  return data.members;
}

/**
 * Hook to fetch group members.
 */
export function useGroupMembers(groupId: string | undefined) {
  const { session } = useAuth();
  const accessToken = session?.access_token;

  return useQuery({
    queryKey: groupMembersQueryKey(groupId!),
    queryFn: () => fetchGroupMembers(accessToken!, groupId!),
    enabled: !!accessToken && !!groupId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
