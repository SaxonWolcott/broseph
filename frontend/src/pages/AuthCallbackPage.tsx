import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@heroui/react';
import { supabase } from '../lib/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
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
        // Check for pending invite from before authentication
        const pendingInvite = sessionStorage.getItem('pendingInvite');
        if (pendingInvite) {
          sessionStorage.removeItem('pendingInvite');
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
  }, [navigate]);

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
