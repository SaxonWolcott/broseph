import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { resizeImageToBlob } from '../lib/resizeImage';
import type { ExtractedReceipt } from '../types/payments';

interface ExtractParams {
  groupId: string;
  file: File;
  signal?: AbortSignal;
}

async function extractReceipt(
  accessToken: string,
  { groupId, file, signal }: ExtractParams,
): Promise<ExtractedReceipt> {
  const resized = await resizeImageToBlob(file);

  const formData = new FormData();
  formData.append('image', resized, 'receipt.jpg');

  const response = await fetch(`/api/groups/${groupId}/payments/extract-from-receipt`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to extract receipt');
  }

  return response.json();
}

export function useExtractReceipt() {
  const { session } = useAuth();
  const accessToken = session?.access_token;

  return useMutation({
    mutationFn: (params: ExtractParams) => extractReceipt(accessToken!, params),
  });
}
