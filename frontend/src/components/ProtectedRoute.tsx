import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from '@heroui/react';
import { useAuth } from '../contexts/AuthContext';
import { useMe } from '../hooks/useMe';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Route guard that redirects unauthenticated users to /login
 * and users without a display name to /signup.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: meLoading } = useMe();
  const location = useLocation();

  if (loading || (user && meLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profile && !profile.displayName) {
    return <Navigate to="/signup" replace />;
  }

  return <>{children}</>;
}
