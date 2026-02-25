import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AvailableTripsSection from '../components/AvailableTripsSection';
import DriverTripList from '../components/DriverTripList';
import DriverProfileSection from '../components/DriverProfileSection';
import EditDriverProfileModal from '../components/EditDriverProfileModal';
import { useGetRequestedTrips, useGetMyTrips } from '../hooks/useQueries';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { TripStatus } from '../backend';

export default function DriverDashboard() {
  const { data: requestedTrips, isLoading: loadingRequested } = useGetRequestedTrips();
  const { data: myTrips, isLoading: loadingMyTrips } = useGetMyTrips();
  const { data: userProfile, isLoading: profileLoading, error: profileError } = useGetCallerUserProfile();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Determine if the driver has any accepted trip — used to lock the availability toggle
  const hasAcceptedTrip = (myTrips ?? []).some(
    (trip) => trip.status === TripStatus.accepted
  );

  // Count trips by section for tab label
  const currentTripCount = (myTrips ?? []).filter((t) => t.status === TripStatus.accepted).length;
  const myTripsTotal = myTrips?.length ?? 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Driver Dashboard</h1>
        <p className="text-muted-foreground">Accept rides and manage your trips</p>
      </div>

      <div className="mb-6">
        <DriverProfileSection
          userProfile={userProfile}
          isLoading={profileLoading}
          error={profileError}
          onEditClick={() => setIsEditModalOpen(true)}
          hasAcceptedTrip={hasAcceptedTrip}
        />
      </div>

      <EditDriverProfileModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userProfile={userProfile}
        hasAcceptedTrip={hasAcceptedTrip}
      />

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="available">
            Available Trips {!loadingRequested && `(${requestedTrips?.length || 0})`}
          </TabsTrigger>
          <TabsTrigger value="mytrips">
            My Trips {!loadingMyTrips && `(${myTripsTotal})`}
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
              <CardTitle>My Trips</CardTitle>
              <CardDescription>
                {currentTripCount > 0
                  ? `You have an active trip in progress — ${myTripsTotal} total`
                  : `Your trip history — ${myTripsTotal} total`}
              </CardDescription>
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
