import { useMutation } from '@tanstack/react-query';
import { MagicLinkRequest, MagicLinkResponse } from '../types/auth';

async function sendSignupMagicLink(
  data: MagicLinkRequest,
): Promise<MagicLinkResponse> {
  const response = await fetch('/api/auth/signup-magic-link', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to send signup link');
  }

  return response.json();
}

export function useSignupMagicLink() {
  return useMutation({
    mutationFn: sendSignupMagicLink,
  });
}
