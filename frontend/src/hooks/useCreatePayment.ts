import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { messagesQueryKey } from './useMessages';

interface CreatePaymentItemInput {
  description: string;
  amountCents: number;
  assignedUserId?: string;
}

interface CreatePaymentParams {
  groupId: string;
  title: string;
  mode: 'per_item' | 'per_person' | 'direct';
  recipientId?: string;
  items: CreatePaymentItemInput[];
}

async function createPayment(
  accessToken: string,
  groupId: string,
  data: Omit<CreatePaymentParams, 'groupId'>,
): Promise<{ jobId: string; status: string }> {
  const response = await fetch(`/api/groups/${groupId}/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create payment request');
  }

  return response.json();
}

export function useCreatePayment() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token;

  return useMutation({
    mutationFn: ({ groupId, ...data }: CreatePaymentParams) =>
      createPayment(accessToken!, groupId, data),

    onSettled: (_data, _error, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: messagesQueryKey(groupId) });
    },
  });
}
