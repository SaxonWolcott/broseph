import { useMutation } from '@tanstack/react-query';

interface MagicLinkSentResponse {
  sent: boolean;
  email: string;
}

async function sendMagicLinkForInvite(
  token: string,
): Promise<MagicLinkSentResponse> {
  const response = await fetch(`/api/invites/${token}/send-magic-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to send sign-in link');
  }

  return response.json();
}

/**
 * Hook to send a magic link to the invite's email for one-click join.
 * No authentication required - the magic link will authenticate the user.
 */
export function useSendInviteMagicLink() {
  return useMutation({
    mutationFn: (token: string) => sendMagicLinkForInvite(token),
  });
}
