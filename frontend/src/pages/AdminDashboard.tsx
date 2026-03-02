import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AdminUsersTab from '../components/AdminUsersTab';
import AdminTripsTab from '../components/AdminTripsTab';
import PricingTab from '../components/PricingTab';
import { useGetAllUsers, useGetAllTrips, useGetMyRole } from '../hooks/useQueries';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Role } from '../backend';
import { ShieldCheck, User, Hash, Settings2 } from 'lucide-react';
import DataLoadErrorBanner from '../components/DataLoadErrorBanner';

export default function AdminDashboard() {
  const { data: users, isLoading: loadingUsers, isError: usersError } = useGetAllUsers();
  const { data: trips, isLoading: loadingTrips, isError: tripsError } = useGetAllTrips();
  const { data: userProfile, isError: profileError } = useGetCallerUserProfile();
  const { identity } = useInternetIdentity();
  const { data: myRole } = useGetMyRole();

  const principalId = identity?.getPrincipal().toString() ?? '—';

  const roleLabel = myRole === Role.admin ? 'Admin'
    : myRole === Role.driver ? 'Driver'
    : myRole === Role.customer ? 'Customer'
    : '—';

  const hasDataError = usersError || tripsError || profileError;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {hasDataError && <DataLoadErrorBanner />}

      <div className="mb-8 flex items-start gap-4">
        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg shrink-0">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users and monitor all trips across the platform</p>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Logged-in Identity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Full Name</p>
              <p className="font-medium">{userProfile?.fullName ?? '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
              <p className="font-medium">{userProfile?.email ?? '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Role</p>
              <Badge variant="outline" className="capitalize">
                {roleLabel}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Hash className="h-3 w-3" /> Principal ID
              </p>
              <p className="font-mono text-xs break-all text-muted-foreground">{principalId}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{loadingUsers ? '…' : (users?.length ?? 0)}</div>
            <p className="text-sm text-muted-foreground mt-1">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{loadingTrips ? '…' : (trips?.length ?? 0)}</div>
            <p className="text-sm text-muted-foreground mt-1">Total Trips</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trips" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="trips">
            Trips {!loadingTrips && `(${trips?.length || 0})`}
          </TabsTrigger>
          <TabsTrigger value="users">
            Users {!loadingUsers && `(${users?.length || 0})`}
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-1.5">
            <Settings2 className="h-3.5 w-3.5" />
            Pricing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Trips</CardTitle>
              <CardDescription>Complete trip history across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminTripsTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Registered users on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminUsersTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Pricing Configuration
              </CardTitle>
              <CardDescription>
                View and edit platform pricing parameters. Changes take effect immediately after saving.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PricingTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
