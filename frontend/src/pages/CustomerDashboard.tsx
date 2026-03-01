import { useState, useEffect } from 'react';
import { useGetCustomerTrips } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import RideRequestForm from '../components/RideRequestForm';
import CustomerTripList from '../components/CustomerTripList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DataLoadErrorBanner from '../components/DataLoadErrorBanner';
import { User } from 'lucide-react';
import type { Trip } from '../lib/types';

export default function CustomerDashboard() {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  // Fetch trips from backend filtered by caller's principal
  const { data: fetchedTrips, isLoading, isError } = useGetCustomerTrips(principal);

  // Local state for optimistic updates — starts with fetched trips
  const [localTrips, setLocalTrips] = useState<Trip[]>([]);

  // Sync fetched trips into local state whenever the query resolves
  useEffect(() => {
    if (fetchedTrips && fetchedTrips.length > 0) {
      setLocalTrips((prev) => {
        // Merge: keep optimistic trips not yet in fetched list, then add fetched
        const fetchedIds = new Set(fetchedTrips.map((t) => t.tripId));
        const optimisticOnly = prev.filter((t) => !fetchedIds.has(t.tripId));
        return [...fetchedTrips, ...optimisticOnly];
      });
    }
  }, [fetchedTrips]);

  /**
   * Called by RideRequestForm after a successful booking.
   * Immediately prepends the new trip to the local list (optimistic update).
   */
  const handleTripCreated = (newTrip: Trip) => {
    setLocalTrips((prev) => {
      // Avoid duplicates if the query already returned this trip
      if (prev.some((t) => t.tripId === newTrip.tripId)) return prev;
      return [newTrip, ...prev];
    });
  };

  // Display trips: prefer local state (includes optimistic), fall back to fetched
  const displayTrips = localTrips.length > 0 ? localTrips : (fetchedTrips ?? []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Data load error banner */}
      {isError && <DataLoadErrorBanner />}

      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold mb-1">Customer Dashboard</h1>
            <p className="text-muted-foreground">Request rides and track your trips</p>
          </div>
          <Badge variant="secondary" className="capitalize text-sm px-3 py-1">
            Role: Customer
          </Badge>
        </div>

        {/* Principal info card */}
        {principal && (
          <div className="mt-4 bg-muted/50 border border-border rounded-lg p-4 flex items-start gap-3">
            <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Principal ID</p>
              <p className="text-xs font-mono break-all text-foreground">{principal}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Request Ride Form */}
        <Card>
          <CardHeader>
            <CardTitle>Request a Ride</CardTitle>
            <CardDescription>Enter your pickup and dropoff locations</CardDescription>
          </CardHeader>
          <CardContent>
            <RideRequestForm onTripCreated={handleTripCreated} />
          </CardContent>
        </Card>

        {/* My Trips */}
        <Card>
          <CardHeader>
            <CardTitle>My Trips</CardTitle>
            <CardDescription>
              {isLoading
                ? 'Loading...'
                : `${displayTrips.length} trip${displayTrips.length !== 1 ? 's' : ''}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerTripList trips={displayTrips} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
