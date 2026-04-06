import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { messagesQueryKey } from './useMessages';
import { paymentCountsQueryKey } from './usePaymentCounts';
import { activePaymentsQueryKey } from './useActivePayments';

/**
 * Subscribe to real-time payment changes (item status, request status).
 * Invalidates messages, counts, and active payments queries.
 */
export function useRealtimePayments(groupId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!groupId) return;

    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: messagesQueryKey(groupId) });
      queryClient.invalidateQueries({ queryKey: paymentCountsQueryKey(groupId) });
      queryClient.invalidateQueries({ queryKey: activePaymentsQueryKey(groupId) });
    };

    const channel = supabase
      .channel(`payments:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payment_requests' },
        invalidateAll,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payment_items' },
        invalidateAll,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);
}
