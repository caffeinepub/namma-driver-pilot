import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetMyRole } from '../hooks/useQueries';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';

const LOADING_TIMEOUT_MS = 9_000;

interface AuthGateProps {
  children: ReactNode;
}

/**
 * AuthGate wraps all protected routes.
 * Blocks rendering until BOTH the identity session is resolved (!isInitializing)
 * AND the myRole query is resolved. Uses a ref guard to prevent double redirects.
 * Shows a timeout error panel after 9 seconds with a single Retry button.
 */
export default function AuthGate({ children }: AuthGateProps) {
  const { identity, isInitializing, clear } = useInternetIdentity();
  const { isFetched: roleFetched, isLoading: roleLoading } = useGetMyRole();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [timedOut, setTimedOut] = useState(false);
  const redirectedRef = useRef(false);

  const isAuthenticated = !!identity;
  // Session is resolved once isInitializing becomes false
  const identityReady = !isInitializing;

  // Start timeout on mount
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), LOADING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  // Once identity is resolved and user is NOT authenticated, redirect once
  useEffect(() => {
    if (!identityReady) return;
    if (redirectedRef.current) return;
    if (!isAuthenticated) {
      redirectedRef.current = true;
      navigate({ to: '/login' });
    }
  }, [identityReady, isAuthenticated, navigate]);

  // Reset redirect guard when identity changes (e.g. after login)
  useEffect(() => {
    if (isAuthenticated) {
      redirectedRef.current = false;
    }
  }, [isAuthenticated]);

  const handleRetry = async () => {
    setTimedOut(false);
    redirectedRef.current = false;
    await clear();
    queryClient.invalidateQueries();
  };

  // Still waiting for identity session to resolve
  if (!identityReady) {
    if (timedOut) {
      return <TimeoutPanel onRetry={handleRetry} />;
    }
    return <LoadingScreen />;
  }

  // Identity resolved but user is not authenticated — render nothing while redirect fires
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated but role query hasn't resolved yet
  if (roleLoading || !roleFetched) {
    if (timedOut) {
      return <TimeoutPanel onRetry={handleRetry} />;
    }
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    </div>
  );
}

function TimeoutPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-sm space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-lg font-semibold text-foreground">Taking too long</h2>
        <p className="text-muted-foreground text-sm">
          The app is taking longer than expected to load. Please retry.
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center justify-center px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
