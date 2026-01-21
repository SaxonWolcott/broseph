import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spinner } from '@heroui/react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/auth';

async function fetchProfile(accessToken: string): Promise<Profile> {
  const response = await fetch('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }
  return response.json();
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase client automatically handles the hash fragment with tokens.
    // We wait briefly then check if session exists.
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setError(error.message);
        return;
      }

      if (data.session) {
        // Check for pending display name from sign-up form
        // Using localStorage (not sessionStorage) so it persists when magic link opens in new tab
        const pendingDisplayName = localStorage.getItem('pendingDisplayName');
        if (pendingDisplayName) {
          localStorage.removeItem('pendingDisplayName');
          // Save display name to profile
          try {
            const response = await fetch('/api/auth/onboard', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${data.session.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ displayName: pendingDisplayName }),
            });
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              console.error('Onboard API error:', response.status, errorData);
            }
          } catch (err) {
            // Non-critical: continue even if onboard fails
            console.warn('Failed to save display name during onboard:', err);
          }
        }

        // Check for auto-accept invite from magic link (one-click join flow)
        const autoAcceptInvite = searchParams.get('autoAcceptInvite');
        if (autoAcceptInvite) {
          // For new users (invited via email), check if they have a display name
          // If not, redirect them to signup to complete their profile first
          try {
            const profile = await fetchProfile(data.session.access_token);

            if (!profile.displayName) {
              // New user without a display name - redirect to signup to complete profile
              // Store the invite token so we can auto-accept after they set their name
              localStorage.setItem('pendingInviteAccept', autoAcceptInvite);
              navigate('/signup', { replace: true });
              return;
            }
          } catch (err) {
            // Profile fetch failed - might be a timing issue with profile creation
            // Store invite and redirect to signup to be safe
            console.warn('Failed to fetch profile, redirecting to signup:', err);
            localStorage.setItem('pendingInviteAccept', autoAcceptInvite);
            navigate('/signup', { replace: true });
            return;
          }

          // User has a display name, proceed with accepting the invite
          try {
            const response = await fetch(
              `/api/invites/${autoAcceptInvite}/accept`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${data.session.access_token}`,
                  'Content-Type': 'application/json',
                },
              },
            );

            if (response.ok) {
              toast.success("You've joined the group!");
              navigate('/groups', { replace: true });
              return;
            } else {
              const errorData = await response.json().catch(() => ({}));
              console.error('Accept invite error:', response.status, errorData);
              // Still navigate to groups, but show error
              toast.error(errorData.message || 'Failed to join group');
              navigate('/groups', { replace: true });
              return;
            }
          } catch (err) {
            console.error('Failed to accept invite:', err);
            toast.error('Failed to join group');
            navigate('/groups', { replace: true });
            return;
          }
        }

        // Check for pending invite from before authentication (legacy flow)
        // Using localStorage (not sessionStorage) so it persists when magic link opens in new tab
        const pendingInvite = localStorage.getItem('pendingInvite');
        if (pendingInvite) {
          localStorage.removeItem('pendingInvite');
          navigate(`/invite/${pendingInvite}`, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        // No session, redirect to login
        navigate('/login', { replace: true });
      }
    };

    // Small delay to ensure supabase has processed the URL hash
    const timer = setTimeout(handleCallback, 100);
    return () => clearTimeout(timer);
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <p className="text-danger mb-4">{error}</p>
          <a href="/login" className="text-primary underline">
            Try again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
