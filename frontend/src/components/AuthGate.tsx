import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

const AUTH_CHECK_TIMEOUT_MS = 5_000;

interface AuthGateProps {
  children: ReactNode;
}

/**
 * AuthGate wraps all protected routes.
 * On mount it waits up to 5 seconds for the identity to resolve.
 * If the user is not authenticated after the timeout, they are redirected to /login.
 * While checking, only a neutral loading spinner is shown — no dashboard content.
 */
export default function AuthGate({ children }: AuthGateProps) {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);

  // Start a 5-second timeout on mount
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), AUTH_CHECK_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  const isAuthenticated = !!identity;

  // Once we know the answer (either identity resolved or timed out), act
  useEffect(() => {
    const resolved = !isInitializing || timedOut;
    if (resolved && !isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isInitializing, timedOut, isAuthenticated, navigate]);

  // Still waiting for auth to resolve
  const stillChecking = isInitializing && !timedOut;

  if (stillChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Checking authentication…</p>
        </div>
      </div>
    );
  }

  // Not authenticated (and not still checking) — render nothing while redirect fires
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
