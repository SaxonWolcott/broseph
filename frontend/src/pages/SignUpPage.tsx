import { useState, FormEvent } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader, Input, Button, Spinner } from '@heroui/react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useCheckEmail } from '../hooks/useCheckEmail';
import { useSignupMagicLink } from '../hooks/useSignupMagicLink';
import { useMe, useOnboard } from '../hooks/useMe';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { user, loading, session } = useAuth();
  const { data: profile, isLoading: meLoading } = useMe();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const checkEmail = useCheckEmail();
  const signupMagicLink = useSignupMagicLink();
  const onboard = useOnboard();

  // Wait for auth and profile to load before making routing decisions
  if (loading || (user && meLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Authenticated user WITH a display name — no reason to be on /signup
  if (user && profile?.displayName) {
    return <Navigate to="/" replace />;
  }

  // Handle completing profile for invited users
  const handleCompleteProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !session) return;

    try {
      // Save display name to profile
      await onboard.mutateAsync({ displayName: displayName.trim() });

      // Check for pending invite to auto-accept
      const pendingInviteAccept = localStorage.getItem('pendingInviteAccept');
      if (pendingInviteAccept) {
        localStorage.removeItem('pendingInviteAccept');

        // Accept the invite
        const response = await fetch(
          `/api/invites/${pendingInviteAccept}/accept`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (response.ok) {
          toast.success("You've joined the group!");
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.message || 'Failed to join group');
        }
      }

      navigate('/home', { replace: true });
    } catch {
      // Error handled by mutation state
    }
  };

  // Handle regular signup for unauthenticated users
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !displayName.trim()) return;

    setAlreadyExists(false);

    try {
      // First check if email already exists
      const result = await checkEmail.mutateAsync({ email });

      if (result.exists) {
        setAlreadyExists(true);
        return;
      }

      // Email is new, store display name and send magic link
      // Using localStorage (not sessionStorage) so it persists when magic link opens in new tab
      localStorage.setItem('pendingDisplayName', displayName.trim());

      // Check if there's a pending invite - include it in the magic link redirect
      const pendingInviteAccept = localStorage.getItem('pendingInviteAccept');
      let redirectTo: string | undefined;
      if (pendingInviteAccept) {
        // Include the invite token in the redirect URL for auto-accept after auth
        redirectTo = `${window.location.origin}/auth/callback?autoAcceptInvite=${pendingInviteAccept}`;
        // Clear it from localStorage since it's now in the redirect URL
        localStorage.removeItem('pendingInviteAccept');
      }

      await signupMagicLink.mutateAsync({ email, redirectTo });
      setSubmitted(true);
    } catch {
      // Error handled by mutation state
    }
  };

  // Show "complete your profile" form for authenticated users without a display name
  if (user && !profile?.displayName) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="flex flex-col items-center gap-2 pb-0">
            <h1 className="text-3xl font-bold">Welcome to Broseph!</h1>
            <p className="text-default-500">Complete your profile to continue</p>
          </CardHeader>
          <CardBody className="pt-6">
            <form onSubmit={handleCompleteProfile} className="flex flex-col gap-4">
              <Input
                label="Display Name"
                placeholder="Your name"
                value={displayName}
                onValueChange={setDisplayName}
                isRequired
                autoFocus
                minLength={2}
                maxLength={100}
                description="This is how you'll appear to others"
              />
              <Button
                type="submit"
                color="primary"
                isLoading={onboard.isPending}
                isDisabled={!displayName.trim()}
              >
                Continue
              </Button>
              {onboard.isError && (
                <p className="text-danger text-sm text-center">
                  {onboard.error.message}
                </p>
              )}
            </form>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="flex flex-col items-center gap-2 pb-0">
            <h1 className="text-2xl font-bold">Check your email</h1>
          </CardHeader>
          <CardBody className="flex flex-col items-center gap-4 pt-6">
            <p className="text-center text-default-600">
              We sent a magic link to <strong>{email}</strong>. Click the link
              to complete your sign up.
            </p>
            <Button
              color="default"
              variant="flat"
              onPress={() => {
                setSubmitted(false);
                setAlreadyExists(false);
                signupMagicLink.reset();
                checkEmail.reset();
              }}
            >
              Use a different email
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const isLoading = checkEmail.isPending || signupMagicLink.isPending;
  const error = checkEmail.error || signupMagicLink.error;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="flex flex-col items-center gap-2 pb-0">
          <h1 className="text-3xl font-bold">Broseph</h1>
          <p className="text-default-500">Create your account</p>
        </CardHeader>
        <CardBody className="pt-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Display Name"
              placeholder="Your name"
              value={displayName}
              onValueChange={setDisplayName}
              isRequired
              autoFocus
              minLength={2}
              maxLength={100}
              description="This is how you'll appear to others"
            />
            <Input
              type="email"
              label="Email"
              placeholder="you@example.com"
              value={email}
              onValueChange={(value) => {
                setEmail(value);
                setAlreadyExists(false);
              }}
              isRequired
            />
            {alreadyExists && (
              <p className="text-warning text-sm text-center">
                An account already exists with this email.{' '}
                <Link to="/login" className="text-primary underline">
                  Log in instead?
                </Link>
              </p>
            )}
            <Button
              type="submit"
              color="primary"
              isLoading={isLoading}
              isDisabled={!email || !displayName.trim()}
            >
              Sign up
            </Button>
            {error && !alreadyExists && (
              <p className="text-danger text-sm text-center">{error.message}</p>
            )}
          </form>
          <p className="text-center text-default-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary underline">
              Log in
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
