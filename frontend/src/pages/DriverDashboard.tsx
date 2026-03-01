import { useState } from 'react';
import { useGetMyTrips } from '../hooks/useQueries';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import AvailableTripsSection from '../components/AvailableTripsSection';
import DriverTripList from '../components/DriverTripList';
import DriverProfileSection from '../components/DriverProfileSection';
import EditDriverProfileModal from '../components/EditDriverProfileModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, User, MapPin } from 'lucide-react';
import DataLoadErrorBanner from '../components/DataLoadErrorBanner';

export default function DriverDashboard() {
  const { data: userProfile, isError: profileError } = useGetCallerUserProfile();
  const { data: myTrips, isError: tripsError } = useGetMyTrips();
  const { identity } = useInternetIdentity();
  const [editOpen, setEditOpen] = useState(false);

  const principal = identity?.getPrincipal().toString();
  const hasDataError = profileError || tripsError;
  const hasAcceptedTrip = (myTrips ?? []).some((t) => '#accepted' in t.status);
  const tripCount = (myTrips ?? []).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Data load error banner */}
      {hasDataError && <DataLoadErrorBanner />}

      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold mb-1">Driver Dashboard</h1>
            <p className="text-muted-foreground">
              {hasAcceptedTrip
                ? 'You have an active trip in progress.'
                : `Manage your trips and availability. ${tripCount > 0 ? `${tripCount} total trip${tripCount !== 1 ? 's' : ''}.` : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize text-sm px-3 py-1">
              Role: Driver
            </Badge>
            {userProfile && (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Principal & Role info card */}
        {principal && (
          <div className="mt-4 bg-muted/50 border border-border rounded-lg p-4 flex items-start gap-3">
            <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Principal ID</p>
              <p className="text-xs font-mono break-all text-foreground">{principal}</p>
            </div>
          </div>
        )}

        {/* View Assigned Trips placeholder button */}
        <div className="mt-4">
          <Button disabled variant="outline" className="gap-2" title="Trip assignment functionality coming soon">
            <MapPin className="h-4 w-4" />
            View Assigned Trips
          </Button>
          <p className="text-xs text-muted-foreground mt-1">Trip assignment functionality coming soon</p>
        </div>
      </div>

      {userProfile && (
        <div className="mb-8">
          <DriverProfileSection profile={userProfile} hasAcceptedTrip={hasAcceptedTrip} />
        </div>
      )}

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="available">Available Trips</TabsTrigger>
          <TabsTrigger value="my-trips">My Trips</TabsTrigger>
        </TabsList>
        <TabsContent value="available" className="mt-6">
          <AvailableTripsSection />
        </TabsContent>
        <TabsContent value="my-trips" className="mt-6">
          <DriverTripList />
        </TabsContent>
      </Tabs>

      {userProfile && (
        <EditDriverProfileModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          profile={userProfile}
          hasAcceptedTrip={hasAcceptedTrip}
        />
      )}
    </div>
  );
}
