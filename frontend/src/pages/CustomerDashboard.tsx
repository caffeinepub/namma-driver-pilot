import { useState } from 'react';
import { useGetCustomerTrips } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import RideRequestForm from '../components/RideRequestForm';
import CustomerTripList from '../components/CustomerTripList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DataLoadErrorBanner from '../components/DataLoadErrorBanner';
import { User } from 'lucide-react';
import type { NormalizedTrip } from '../utils/normalizeTrip';
import type { Trip as LocalTrip } from '../lib/types';
import { normalizeTrip } from '../utils/normalizeTrip';
import type { Trip as BackendTrip } from '../backend';

/**
 * Convert a local Trip (variant-object style from RideRequestForm) to NormalizedTrip.
 * RideRequestForm already converts BackendTrip → local Trip via backendTripToLocalTrip,
 * so we receive the local Trip here and need to normalize its variant fields.
 */
function localTripToNormalized(trip: LocalTrip): NormalizedTrip {
  // Re-use normalizeTrip by casting — the extractVariantKey handles variant objects too
  return normalizeTrip(trip as unknown as BackendTrip);
}

export default function CustomerDashboard() {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  // Fetch trips from backend for the current customer
  const { data: fetchedTrips, isLoading, isError } = useGetCustomerTrips(principal);

  // Local state for optimistic updates (newly created trips before backend refresh)
  const [optimisticTrips, setOptimisticTrips] = useState<NormalizedTrip[]>([]);

  // Called by RideRequestForm with the local Trip type (already converted from BackendTrip)
  const handleTripCreated = (newTrip: LocalTrip) => {
    const normalized = localTripToNormalized(newTrip);
    setOptimisticTrips((prev) => {
      if (prev.some((t) => t.tripId === normalized.tripId)) return prev;
      return [normalized, ...prev];
    });
  };

  // Merge: optimistic trips first (newest), then backend trips (deduped)
  const fetchedIds = new Set((fetchedTrips ?? []).map((t) => t.tripId));
  const dedupedOptimistic = optimisticTrips.filter((t) => !fetchedIds.has(t.tripId));
  const displayTrips = [...dedupedOptimistic, ...(fetchedTrips ?? [])];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
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
        <Card>
          <CardHeader>
            <CardTitle>Request a Ride</CardTitle>
            <CardDescription>Enter your pickup and dropoff locations</CardDescription>
          </CardHeader>
          <CardContent>
            <RideRequestForm onTripCreated={handleTripCreated} />
          </CardContent>
        </Card>

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
