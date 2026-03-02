import { useGetAvailableTripsForDriver, useAcceptTrip } from '../hooks/useQueries';
import { normalizeTrip, type NormalizedTrip } from '../utils/normalizeTrip';
import type { Trip as BackendTrip } from '../backend';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Clock, Car, Loader2 } from 'lucide-react';

function formatLocation(loc: NormalizedTrip['pickupLocation']): string {
  const parts = [loc.area, loc.pincode].filter(Boolean);
  return parts.join(', ') || '—';
}

function formatDropoff(loc: NormalizedTrip['dropoffLocation']): string {
  if (!loc) return '—';
  const parts = [loc.area, loc.pincode].filter(Boolean);
  return parts.join(', ') || '—';
}

function getVehicleLabel(vehicleType: string): string {
  if (vehicleType === 'hatchback') return 'Hatchback';
  if (vehicleType === 'sedan') return 'Sedan';
  if (vehicleType === 'suv') return 'SUV';
  if (vehicleType === 'luxury') return 'Luxury';
  return 'Vehicle';
}

function getTripTypeLabel(tripType: string): string {
  if (tripType === 'local') return 'Local';
  if (tripType === 'outstation') return 'Outstation';
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

export default function AvailableTripsSection() {
  const { data: availableTrips, isLoading } = useGetAvailableTripsForDriver();
  const acceptTrip = useAcceptTrip();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  // Normalize all trips through normalizeTrip() before rendering
  const trips: NormalizedTrip[] = ((availableTrips as BackendTrip[] | undefined) ?? []).map(
    (t) => normalizeTrip(t)
  );

  if (trips.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Car className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>No available trips right now.</p>
        <p className="text-sm mt-1">Check back soon for new ride requests in your service area.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-3 pr-3">
        {trips.map((trip) => (
          <Card key={trip.tripId} className="border">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{getTripTypeLabel(trip.tripType)}</Badge>
                    <Badge variant="secondary">{getVehicleLabel(trip.vehicleType)}</Badge>
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
