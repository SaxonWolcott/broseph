import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { messagesQueryKey } from './useMessages';

/**
 * Subscribe to real-time reaction changes (INSERT/DELETE on message_reactions).
 * Cannot filter by group_id (column doesn't exist on table), so we listen
 * globally and invalidate the messages query for the current group.
 */
export function useRealtimeReactions(groupId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`reactions:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reactions',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: messagesQueryKey(groupId) });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'message_reactions',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: messagesQueryKey(groupId) });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);
}
