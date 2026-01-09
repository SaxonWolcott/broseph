import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { MessageListResponse } from '../types/messages';

export const messagesQueryKey = (groupId: string) => ['groups', groupId, 'messages'];

async function fetchMessages(
  accessToken: string,
  groupId: string,
  cursor?: string,
): Promise<MessageListResponse> {
  const params = new URLSearchParams();
  if (cursor) {
    params.set('cursor', cursor);
  }
  params.set('limit', '50');

  const response = await fetch(
    `/api/groups/${groupId}/messages?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch messages');
  }

  return response.json();
}

/**
 * Hook to fetch messages with infinite scroll (cursor pagination).
 */
export function useMessages(groupId: string | undefined) {
  const { session } = useAuth();
  const accessToken = session?.access_token;

  return useInfiniteQuery({
    queryKey: messagesQueryKey(groupId!),
    queryFn: ({ pageParam }) =>
      fetchMessages(accessToken!, groupId!, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!accessToken && !!groupId,
    staleTime: 1000 * 30, // 30 seconds
  });
}
