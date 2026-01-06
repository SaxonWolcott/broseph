import { useState, FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardBody, CardHeader, Input, Button } from '@heroui/react';
import { useAuth } from '../contexts/AuthContext';
import { useMagicLink } from '../hooks/useMagicLink';

export default function SignInPage() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const magicLink = useMagicLink();

  // Redirect if already authenticated
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
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
                magicLink.reset();
              }}
            >
              Use a different email
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="flex flex-col items-center gap-2 pb-0">
          <h1 className="text-3xl font-bold">Broseph</h1>
          <p className="text-default-500">Sign in to continue</p>
        </CardHeader>
        <CardBody className="pt-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="email"
              label="Email"
              placeholder="you@example.com"
              value={email}
              onValueChange={setEmail}
              isRequired
              autoFocus
            />
            <Button
              type="submit"
              color="primary"
              isLoading={magicLink.isPending}
              isDisabled={!email}
            >
              Send magic link
            </Button>
            {magicLink.isError && (
              <p className="text-danger text-sm text-center">
                {magicLink.error.message}
              </p>
            )}
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
