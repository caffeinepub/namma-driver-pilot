import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetMyRole, useSetMyRole } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Car, Users, Loader2, LogOut, AlertCircle, RefreshCw } from 'lucide-react';

export default function SelectRolePage() {
  const { identity, clear } = useInternetIdentity();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, isLoading, isError, isFetched, refetch } = useGetMyRole();
  const setMyRole = useSetMyRole();

  const principal = identity?.getPrincipal().toString();

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

  const handleSelectRole = async (selectedRole: 'customer' | 'driver') => {
    try {
      await setMyRole.mutateAsync(selectedRole);
      if (selectedRole === 'customer') {
        navigate({ to: '/customer/dashboard' });
      } else {
        navigate({ to: '/driver/dashboard' });
      }
    } catch (err) {
      console.error('[SelectRolePage] setMyRole failed:', err);
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
          <p className="text-muted-foreground text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <CardTitle>Unable to Load Role</CardTitle>
            <CardDescription>
              We couldn't check your current role. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isMutating = setMyRole.isPending;

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Choose Your Role</h1>
          <p className="text-muted-foreground text-lg">
            Select how you want to use Namma Driver Pilot
          </p>
        </div>

        {/* Principal ID */}
        {principal && (
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Your Principal ID</p>
            <p className="text-xs font-mono break-all text-foreground">{principal}</p>
          </div>
        )}

        {/* Role selection cards */}
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Customer */}
          <button
            onClick={() => handleSelectRole('customer')}
            disabled={isMutating}
            className="group bg-card border-2 border-border hover:border-primary rounded-xl p-8 text-left transition-all duration-200 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                {isMutating && setMyRole.variables === 'customer' ? (
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                ) : (
                  <Users className="h-10 w-10 text-primary" />
                )}
              </div>
              <h2 className="text-2xl font-bold">I am a Customer</h2>
              <p className="text-muted-foreground text-sm">
                Book rides and travel to your destination with ease
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 text-left w-full">
                <li>• Request rides anytime</li>
                <li>• Track your trips</li>
                <li>• View trip history</li>
              </ul>
            </div>
          </button>

          {/* Driver */}
          <button
            onClick={() => handleSelectRole('driver')}
            disabled={isMutating}
            className="group bg-card border-2 border-border hover:border-primary rounded-xl p-8 text-left transition-all duration-200 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                {isMutating && setMyRole.variables === 'driver' ? (
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                ) : (
                  <Car className="h-10 w-10 text-primary" />
                )}
              </div>
              <h2 className="text-2xl font-bold">I am a Driver</h2>
              <p className="text-muted-foreground text-sm">
                Accept ride requests and earn by driving
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 text-left w-full">
                <li>• View available trips</li>
                <li>• Accept ride requests</li>
                <li>• Manage your trips</li>
              </ul>
            </div>
          </button>
        </div>

        {/* Error from mutation */}
        {setMyRole.isError && (
          <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Failed to set role. Please try again.</span>
          </div>
        )}

        {/* Logout */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={handleLogout}
            disabled={isMutating}
            className="text-muted-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
