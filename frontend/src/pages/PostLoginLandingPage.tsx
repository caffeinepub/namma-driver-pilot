import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useGetMyRole } from '../hooks/useQueries';
import { Role } from '../backend';
import { Button } from '../components/ui/button';

export default function PostLoginLandingPage() {
  const navigate = useNavigate();
  const { data: role, isLoading, isError, isFetched, refetch } = useGetMyRole();

  React.useEffect(() => {
    if (!isFetched || isLoading) return;

    if (role === Role.admin) {
      navigate({ to: '/admin/dashboard' });
    } else if (role === Role.driver) {
      navigate({ to: '/driver/dashboard' });
    } else if (role === Role.customer) {
      navigate({ to: '/customer/dashboard' });
    } else {
      // unassigned or null
      navigate({ to: '/select-role' });
    }
  }, [role, isLoading, isFetched, navigate]);

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Failed to load your role</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            We couldn't determine your account type. Please try again.
          </p>
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Setting up your account…</p>
      </div>
    </div>
  );
}
