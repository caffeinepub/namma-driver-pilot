import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AvailableTripsSection from '../components/AvailableTripsSection';
import DriverTripList from '../components/DriverTripList';
import { useGetRequestedTrips, useGetMyTrips } from '../hooks/useQueries';

export default function DriverDashboard() {
  const { data: requestedTrips, isLoading: loadingRequested } = useGetRequestedTrips();
  const { data: myTrips, isLoading: loadingMyTrips } = useGetMyTrips();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Driver Dashboard</h1>
        <p className="text-muted-foreground">Accept rides and manage your trips</p>
      </div>

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="available">
            Available Trips {!loadingRequested && `(${requestedTrips?.length || 0})`}
          </TabsTrigger>
          <TabsTrigger value="mytrips">
            My Trips {!loadingMyTrips && `(${myTrips?.length || 0})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Trips</CardTitle>
              <CardDescription>Trips waiting to be accepted by drivers</CardDescription>
            </CardHeader>
            <CardContent>
              <AvailableTripsSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mytrips" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Accepted Trips</CardTitle>
              <CardDescription>Trips you have accepted</CardDescription>
            </CardHeader>
            <CardContent>
              <DriverTripList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
