import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { groupMembersQueryKey } from './useGroupMembers';
import { groupQueryKey } from './useGroup';

/**
 * Hook to subscribe to real-time member updates for a group.
 * Automatically invalidates the members and group cache when members join or leave.
 */
export function useRealtimeMembers(groupId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`members:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT and DELETE
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          // Invalidate members list cache
          queryClient.invalidateQueries({ queryKey: groupMembersQueryKey(groupId) });
          // Invalidate group cache (for member count in header)
          queryClient.invalidateQueries({ queryKey: groupQueryKey(groupId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);
}
