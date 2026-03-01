import { useGetAllTrips, useAcceptTrip, useGetDriverProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import type { Trip } from '../lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Clock, Car, Loader2 } from 'lucide-react';

function formatLocation(loc: Trip['pickupLocation']): string {
  const parts = [loc.area, loc.pincode].filter(Boolean);
  return parts.join(', ') || '—';
}

function formatDropoff(loc: Trip['dropoffLocation']): string {
  if (!loc || loc.length === 0) return '—';
  const l = loc[0];
  if (!l) return '—';
  const parts = [l.area, l.pincode].filter(Boolean);
  return parts.join(', ') || '—';
}

function getVehicleLabel(trip: Trip): string {
  const v = trip.vehicleType;
  if ('#hatchback' in v) return 'Hatchback';
  if ('#sedan' in v) return 'Sedan';
  if ('#suv' in v) return 'SUV';
  if ('#luxury' in v) return 'Luxury';
  return 'Vehicle';
}

function getTripTypeLabel(trip: Trip): string {
  const t = trip.tripType;
  if ('#local' in t) return 'Local';
  if ('#outstation' in t) return 'Outstation';
  return 'Trip';
}

function formatDate(timestamp: bigint): string {
  try {
    const ms = Number(timestamp) / 1_000_000;
    return new Date(ms).toLocaleString();
  } catch {
    return '—';
  }
}

function isPending(trip: Trip): boolean {
  return '#requested' in trip.status;
}

function hasNoDriver(trip: Trip): boolean {
  const d = trip.driverId;
  if (!d) return true;
  if (Array.isArray(d)) return d.length === 0;
  return false;
}

export default function AvailableTripsSection() {
  const { data: allTrips, isLoading: tripsLoading } = useGetAllTrips();
  const { data: driverProfile, isLoading: profileLoading } = useGetDriverProfile();
  const acceptTrip = useAcceptTrip();
  const { identity } = useInternetIdentity();

  const isLoading = tripsLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  // If driver is off-duty, show no trips
  const isOnDuty = driverProfile?.isAvailable === true;

  if (!isOnDuty) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Car className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>You are currently Off-Duty.</p>
        <p className="text-sm mt-1">Go On-Duty to see available trips.</p>
      </div>
    );
  }

  // Filter: pending status AND no driver assigned
  const availableTrips = (allTrips ?? []).filter(
    (trip) => isPending(trip) && hasNoDriver(trip)
  );

  if (availableTrips.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Car className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>No available trips right now.</p>
        <p className="text-sm mt-1">Check back soon for new ride requests.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-3 pr-3">
        {availableTrips.map((trip) => (
          <Card key={trip.tripId} className="border">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{getTripTypeLabel(trip)}</Badge>
                    <Badge variant="secondary">{getVehicleLabel(trip)}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <span className="text-muted-foreground text-xs">Pickup: </span>
                        {formatLocation(trip.pickupLocation)}
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <span className="text-muted-foreground text-xs">Drop: </span>
                        {formatDropoff(trip.dropoffLocation)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(trip.createdTime)}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => acceptTrip.mutate(trip.tripId)}
                  disabled={acceptTrip.isPending}
                >
                  {acceptTrip.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Accept'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
