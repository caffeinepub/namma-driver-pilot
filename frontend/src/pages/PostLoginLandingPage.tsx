import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetMyRole } from '../hooks/useQueries';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PostLoginLandingPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { role, isLoading, isError, isFetched, refetch } = useGetMyRole();

  useEffect(() => {
    if (!isFetched || isLoading || isError) return;

    // role is already a normalized AppRole string ('admin' | 'customer' | 'driver' | null)
    // derived via normalizeRole() in useGetMyRole — safe to compare directly
    const roleKey = role ?? null;

    if (roleKey === 'admin') {
      navigate({ to: '/admin/dashboard' });
    } else if (roleKey === 'driver') {
      navigate({ to: '/driver/dashboard' });
    } else if (roleKey === 'customer') {
      navigate({ to: '/customer/dashboard' });
    } else {
      // No role assigned yet
      navigate({ to: '/select-role' });
    }
  }, [role, isLoading, isError, isFetched, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Determining your role…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-3">
            <div className="flex justify-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-xl font-bold">Unable to Determine Role</CardTitle>
            <p className="text-sm text-muted-foreground">
              We couldn't fetch your role from the backend. Please try again.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {identity && (
              <div className="bg-muted rounded-md p-3">
                <p className="text-xs text-muted-foreground mb-1">Principal ID</p>
                <p className="text-xs font-mono break-all">{identity.getPrincipal().toString()}</p>
              </div>
            )}
            <Button className="w-full" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect is in progress — show a brief spinner
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground text-sm">Redirecting…</p>
      </div>
    </div>
  );
}
