import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetMyRole, useSetMyRoleCustomer, useSetMyRoleDriver } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Car, Users, Loader2, LogOut, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function SelectRolePage() {
  const { identity, clear } = useInternetIdentity();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, isLoading, isError, isFetched, refetch } = useGetMyRole();
  const setCustomer = useSetMyRoleCustomer();
  const setDriver = useSetMyRoleDriver();

  const principal = identity?.getPrincipal().toString();
  const isSetting = setCustomer.isPending || setDriver.isPending;

  // If user already has a role, redirect them
  useEffect(() => {
    if (!isFetched || isLoading || isError) return;
    if (role === 'admin') {
      navigate({ to: '/admin/dashboard' });
    } else if (role === 'customer') {
      navigate({ to: '/customer/dashboard' });
    } else if (role === 'driver') {
      navigate({ to: '/driver/dashboard' });
    }
    // role === null → stay on this page
  }, [role, isLoading, isError, isFetched, navigate]);

  const handleSelectCustomer = async () => {
    try {
      await setCustomer.mutateAsync();
      navigate({ to: '/customer/dashboard' });
    } catch (err) {
      console.error('[SelectRolePage] setMyRoleCustomer failed:', err);
      toast.error('Failed to set role. Please try again.');
    }
  };

  const handleSelectDriver = async () => {
    try {
      await setDriver.mutateAsync();
      navigate({ to: '/driver/dashboard' });
    } catch (err) {
      console.error('[SelectRolePage] setMyRoleDriver failed:', err);
      toast.error('Failed to set role. Please try again.');
    }
  };

  const handleLogout = async () => {
    await clear();
    localStorage.clear();
    sessionStorage.clear();
    queryClient.clear();
    navigate({ to: '/login' });
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Checking your account…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="font-semibold">Unable to load account info</p>
          <p className="text-muted-foreground text-sm">
            We couldn't fetch your account details. Please try again.
          </p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome!</h1>
          <p className="text-muted-foreground">
            Choose how you'd like to use the platform.
          </p>
          {principal && (
            <p className="text-xs text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded-md inline-block max-w-full truncate">
              {principal}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Customer Card */}
          <Card
            className={`cursor-pointer border-2 transition-all hover:border-primary hover:shadow-md ${
              isSetting ? 'opacity-60 pointer-events-none' : ''
            }`}
            onClick={handleSelectCustomer}
          >
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-3">
                <div className="p-4 rounded-full bg-primary/10">
                  <Users className="h-10 w-10 text-primary" />
                </div>
              </div>
              <CardTitle className="text-xl">I am a Customer</CardTitle>
              <CardDescription>Book rides and manage your trips</CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-6">
              <Button
                className="w-full"
                onClick={(e) => { e.stopPropagation(); handleSelectCustomer(); }}
                disabled={isSetting}
              >
                {setCustomer.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up…
                  </>
                ) : (
                  'Continue as Customer'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Driver Card */}
          <Card
            className={`cursor-pointer border-2 transition-all hover:border-primary hover:shadow-md ${
              isSetting ? 'opacity-60 pointer-events-none' : ''
            }`}
            onClick={handleSelectDriver}
          >
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-3">
                <div className="p-4 rounded-full bg-primary/10">
                  <Car className="h-10 w-10 text-primary" />
                </div>
              </div>
              <CardTitle className="text-xl">I am a Driver</CardTitle>
              <CardDescription>Accept trips and earn money</CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-6">
              <Button
                className="w-full"
                variant="outline"
                onClick={(e) => { e.stopPropagation(); handleSelectDriver(); }}
                disabled={isSetting}
              >
                {setDriver.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up…
                  </>
                ) : (
                  'Continue as Driver'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={handleLogout} disabled={isSetting}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
