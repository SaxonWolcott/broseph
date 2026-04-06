import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { messagesQueryKey } from './useMessages';

interface CancelPaymentParams {
  groupId: string;
  paymentId: string;
}

async function cancelPayment(
  accessToken: string,
  groupId: string,
  paymentId: string,
): Promise<unknown> {
  const response = await fetch(
    `/api/groups/${groupId}/payments/${paymentId}/cancel`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to cancel payment request');
  }

  return response.json();
}

export function useCancelPayment() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token;

  return useMutation({
    mutationFn: ({ groupId, paymentId }: CancelPaymentParams) =>
      cancelPayment(accessToken!, groupId, paymentId),

    onSettled: (_data, _error, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: messagesQueryKey(groupId) });
    },
  });
}
