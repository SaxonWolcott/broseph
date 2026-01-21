import { useMutation } from '@tanstack/react-query';
import { CheckEmailRequest, CheckEmailResponse } from '../types/auth';

async function checkEmail(
  data: CheckEmailRequest,
): Promise<CheckEmailResponse> {
  const response = await fetch('/api/auth/check-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to check email');
  }

  return response.json();
}

export function useCheckEmail() {
  return useMutation({
    mutationFn: checkEmail,
  });
}
