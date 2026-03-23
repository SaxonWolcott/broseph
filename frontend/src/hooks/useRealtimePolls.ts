import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { messagesQueryKey } from './useMessages';

/**
 * Subscribe to real-time poll changes (votes, options, poll state).
 * Invalidates the messages query to refresh poll data.
 */
export function useRealtimePolls(groupId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`polls:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'poll_votes' },
        () => {
          queryClient.invalidateQueries({ queryKey: messagesQueryKey(groupId) });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'polls' },
        () => {
          queryClient.invalidateQueries({ queryKey: messagesQueryKey(groupId) });
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'poll_options' },
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
