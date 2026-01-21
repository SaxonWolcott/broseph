import { useState, FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, Input, Button } from '@heroui/react';
import { useAuth } from '../contexts/AuthContext';
import { useCheckEmail } from '../hooks/useCheckEmail';
import { useMagicLink } from '../hooks/useMagicLink';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const checkEmail = useCheckEmail();
  const magicLink = useMagicLink();

  // Redirect if already authenticated
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setNotFound(false);

    try {
      // First check if email exists
      const result = await checkEmail.mutateAsync({ email });

      if (!result.exists) {
        setNotFound(true);
        return;
      }

      // Email exists, send magic link
      await magicLink.mutateAsync({ email });
      setSubmitted(true);
    } catch {
      // Error handled by mutation state
    }
  };

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
              to sign in.
            </p>
            <Button
              color="default"
              variant="flat"
              onPress={() => {
                setSubmitted(false);
                setNotFound(false);
                magicLink.reset();
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

  const isLoading = checkEmail.isPending || magicLink.isPending;
  const error = checkEmail.error || magicLink.error;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="flex flex-col items-center gap-2 pb-0">
          <h1 className="text-3xl font-bold">Broseph</h1>
          <p className="text-default-500">Welcome back</p>
        </CardHeader>
        <CardBody className="pt-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="email"
              label="Email"
              placeholder="you@example.com"
              value={email}
              onValueChange={(value) => {
                setEmail(value);
                setNotFound(false);
              }}
              isRequired
              autoFocus
            />
            {notFound && (
              <p className="text-warning text-sm text-center">
                No account found with this email.{' '}
                <Link to="/signup" className="text-primary underline">
                  Sign up instead?
                </Link>
              </p>
            )}
            <Button
              type="submit"
              color="primary"
              isLoading={isLoading}
              isDisabled={!email}
            >
              Send magic link
            </Button>
            {error && !notFound && (
              <p className="text-danger text-sm text-center">{error.message}</p>
            )}
          </form>
          <p className="text-center text-default-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary underline">
              Sign up
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
