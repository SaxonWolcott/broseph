import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Profile, OnboardRequest } from '../types/auth';

const PROFILE_QUERY_KEY = ['profile', 'me'];

async function fetchProfile(accessToken: string): Promise<Profile> {
  const response = await fetch('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch profile');
  }

  return response.json();
}

async function updateProfile(
  accessToken: string,
  data: OnboardRequest,
): Promise<Profile> {
  const response = await fetch('/api/auth/onboard', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update profile');
  }

  return response.json();
}

/**
 * Hook to fetch the current user's profile.
 * Only fetches when authenticated (session exists).
 */
export function useMe() {
  const { session } = useAuth();
  const accessToken = session?.access_token;

  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: () => fetchProfile(accessToken!),
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Mutation hook to update profile during onboarding.
 * Automatically updates the cached profile on success.
 */
export function useOnboard() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token;

  return useMutation({
    mutationFn: (data: OnboardRequest) => updateProfile(accessToken!, data),
    onSuccess: (profile) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, profile);
    },
  });
}
