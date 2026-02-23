import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminUsersTab from '../components/AdminUsersTab';
import AdminTripsTab from '../components/AdminTripsTab';
import { useGetAllUsers, useGetAllTrips } from '../hooks/useQueries';

export default function AdminDashboard() {
  const { data: users, isLoading: loadingUsers } = useGetAllUsers();
  const { data: trips, isLoading: loadingTrips } = useGetAllTrips();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users and monitor all trips</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="users">
            Users {!loadingUsers && `(${users?.length || 0})`}
          </TabsTrigger>
          <TabsTrigger value="trips">
            Trips {!loadingTrips && `(${trips?.length || 0})`}
          </TabsTrigger>
        </TabsList>

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
      </Tabs>
    </div>
  );
}
