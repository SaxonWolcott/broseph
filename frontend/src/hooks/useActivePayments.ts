import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { PaymentData } from '../types/payments';

export const activePaymentsQueryKey = (groupId: string) => [
  'groups',
  groupId,
  'payments',
  'active',
];

async function fetchActivePayments(
  accessToken: string,
  groupId: string,
): Promise<PaymentData[]> {
  const response = await fetch(`/api/groups/${groupId}/payments/active`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch active payments');
  }

  return response.json();
}

export function useActivePayments(groupId: string | undefined) {
  const { session } = useAuth();
  const accessToken = session?.access_token;

  return useQuery({
    queryKey: activePaymentsQueryKey(groupId!),
    queryFn: () => fetchActivePayments(accessToken!, groupId!),
    enabled: !!accessToken && !!groupId,
    staleTime: 1000 * 30, // 30 seconds
  });
}
