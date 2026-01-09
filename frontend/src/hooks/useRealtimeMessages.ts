import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { messagesQueryKey } from './useMessages';

/**
 * Hook to subscribe to real-time message updates for a group.
 * Automatically invalidates the messages cache when new messages arrive.
 */
export function useRealtimeMessages(groupId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`messages:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          // Invalidate messages cache to trigger refetch
          queryClient.invalidateQueries({ queryKey: messagesQueryKey(groupId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);
}
