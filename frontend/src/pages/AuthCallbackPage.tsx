import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spinner } from '@heroui/react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

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
        // No session, redirect to sign in
        navigate('/signin', { replace: true });
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
          <a href="/signin" className="text-primary underline">
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
