import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Spinner } from '@heroui/react';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load pages for better performance
const GroupsPage = lazy(() => import('./pages/GroupsPage'));
const GroupChatPage = lazy(() => import('./pages/GroupChatPage'));
const InvitePage = lazy(() => import('./pages/InvitePage'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner size="lg" />
    </div>
  );
}

function App() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/signin" element={<Navigate to="/login" replace />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/invite/:token" element={<InvitePage />} />

          {/* Protected routes */}
          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <GroupsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:id"
            element={
              <ProtectedRoute>
                <GroupChatPage />
              </ProtectedRoute>
            }
          />

          {/* Redirect root to groups */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/groups" replace />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to groups */}
          <Route path="*" element={<Navigate to="/groups" replace />} />
        </Routes>
      </Suspense>
    </main>
  );
}

export default App;
