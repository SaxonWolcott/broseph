import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';

interface CheckoutParams {
  groupId: string;
  paymentId: string;
  itemId: string;
}

interface CheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

async function initiateCheckout(
  accessToken: string,
  groupId: string,
  paymentId: string,
  itemId: string,
): Promise<CheckoutResponse> {
  const response = await fetch(
    `/api/groups/${groupId}/payments/${paymentId}/checkout`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemId }),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to initiate checkout');
  }

  return response.json();
}

export function usePaymentCheckout() {
  const { session } = useAuth();
  const accessToken = session?.access_token;

  return useMutation({
    mutationFn: ({ groupId, paymentId, itemId }: CheckoutParams) =>
      initiateCheckout(accessToken!, groupId, paymentId, itemId),

    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      window.location.href = data.checkoutUrl;
    },
  });
}
