import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';

export const paymentCountsQueryKey = (groupId: string) => [
  'groups',
  groupId,
  'payments',
  'counts',
];

interface PaymentCounts {
  activeCount: number;
  attentionCount: number;
}

async function fetchPaymentCounts(
  accessToken: string,
  groupId: string,
): Promise<PaymentCounts> {
  const response = await fetch(`/api/groups/${groupId}/payments/counts`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch payment counts');
  }

  return response.json();
}

export function usePaymentCounts(groupId: string | undefined) {
  const { session } = useAuth();
  const accessToken = session?.access_token;

  return useQuery({
    queryKey: paymentCountsQueryKey(groupId!),
    queryFn: () => fetchPaymentCounts(accessToken!, groupId!),
    enabled: !!accessToken && !!groupId,
    staleTime: 1000 * 15, // 15 seconds
  });
}
