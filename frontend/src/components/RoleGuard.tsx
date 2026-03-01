import { ReactNode, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetMyRole } from '../hooks/useQueries';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotAuthorizedPage from '../pages/NotAuthorizedPage';
import type { AppRole } from '../lib/types';
import { toast } from 'sonner';

interface RoleGuardProps {
  requiredRole: AppRole;
  children: ReactNode;
  /** If true, show NotAuthorizedPage instead of redirecting to /select-role on mismatch */
  showNotAuthorized?: boolean;
}

/**
 * RoleGuard checks the user's role after authentication.
 * - If not authenticated: redirects to /login
 * - While loading: shows a spinner
 * - On error: shows a retry UI (no infinite loading)
 * - If role matches: renders children
 * - If role mismatches:
 *   - For admin routes (showNotAuthorized=true): shows NotAuthorizedPage + toast "Admin only"
 *   - For customer/driver routes: redirects to /select-role
 */
export default function RoleGuard({ requiredRole, children, showNotAuthorized = false }: RoleGuardProps) {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { role, isLoading, isError, isFetched, refetch } = useGetMyRole();

  const isAuthenticated = !!identity;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isFetched || isLoading || isError || !isAuthenticated) return;
    if (role === requiredRole) return; // authorized — do nothing

    if (showNotAuthorized) {
      // For admin routes: show toast and render NotAuthorizedPage below
      if (requiredRole === 'admin') {
        toast.error('Admin only', {
          description: 'You do not have permission to access this area.',
          id: 'admin-only-toast', // prevent duplicate toasts
        });
      }
      return;
    }
    // For customer/driver routes: redirect to /select-role
    navigate({ to: '/select-role' });
  }, [role, isLoading, isError, isFetched, isAuthenticated, requiredRole, showNotAuthorized, navigate]);

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Verifying access…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="font-semibold">Unable to verify access</p>
          <p className="text-muted-foreground text-sm">
            We couldn't verify your permissions. Please try again.
          </p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!isFetched) return null;

  // Role mismatch
  if (role !== requiredRole) {
    if (showNotAuthorized) {
      return <NotAuthorizedPage />;
    }
    // Redirect is handled by the useEffect above; render nothing while it fires
    return null;
  }

  return <>{children}</>;
}
