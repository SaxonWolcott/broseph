import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { CreateGroupRequest, JobAcceptedResponse, GroupListResponse } from '../types/groups';
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
 * Wait for a new group to appear in the groups list.
 * Polls with increasing intervals until the group count increases or timeout.
 */
async function waitForNewGroup(
  accessToken: string,
  previousCount: number,
  maxAttempts = 10,
): Promise<void> {
  const delays = [200, 300, 500, 500, 700, 1000, 1000, 1500, 2000, 2000];

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, delays[i] || 1000));

    try {
      const response = await fetch('/api/groups', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: GroupListResponse = await response.json();
        if (data.groups.length > previousCount) {
          return; // New group appeared!
        }
      }
    } catch {
      // Continue polling
    }
  }
  // Timeout - group may still be processing, but we've waited long enough
}

/**
 * Hook to create a new group.
 * Waits for the group to actually appear before resolving.
 */
export function useCreateGroup() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token;

  return useMutation({
    mutationFn: async (data: CreateGroupRequest) => {
      // Get current group count before creating
      const currentData = queryClient.getQueryData<GroupListResponse>(GROUPS_QUERY_KEY);
      const previousCount = currentData?.groups.length ?? 0;

      // Create the group (queues the job)
      const result = await createGroup(accessToken!, data);

      // Wait for the group to actually appear in the database
      await waitForNewGroup(accessToken!, previousCount);

      return result;
    },
    onSuccess: () => {
      // Invalidate to get the final fresh data
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
    },
  });
}
