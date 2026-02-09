import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { PROMPT_FEED_QUERY_KEY } from './usePromptFeed';
import { PROMPTS_TODO_QUERY_KEY } from './usePromptsToDo';

/**
 * Hook to subscribe to real-time prompt response updates.
 * Listens for new prompt_responses inserts and invalidates
 * both the feed and todo caches so the UI stays fresh.
 */
export function useRealtimePromptResponses() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`prompt_responses`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'prompt_responses',
        },
        () => {
          // Invalidate prompt feed and prompts to do caches to trigger refetch
          queryClient.invalidateQueries({ queryKey: PROMPT_FEED_QUERY_KEY });
          queryClient.invalidateQueries({ queryKey: PROMPTS_TODO_QUERY_KEY });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
