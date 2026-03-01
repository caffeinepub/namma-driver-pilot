import { useGetAllTrips, useCompleteTrip } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import type { Trip } from '../lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Clock, CheckCircle2, Loader2 } from 'lucide-react';

function getStatusLabel(trip: Trip): string {
  const s = trip.status;
  if ('#requested' in s) return 'Pending';
  if ('#accepted' in s) return 'Accepted';
  if ('#completed' in s) return 'Completed';
  if ('#cancelled' in s) return 'Cancelled';
  return 'Unknown';
}

function getStatusVariant(trip: Trip): 'default' | 'secondary' | 'outline' | 'destructive' {
  const s = trip.status;
  if ('#completed' in s) return 'default';
  if ('#accepted' in s) return 'secondary';
  if ('#cancelled' in s) return 'destructive';
  return 'outline';
}

function isAccepted(trip: Trip): boolean {
  return '#accepted' in trip.status;
}

function isCompleted(trip: Trip): boolean {
  return '#completed' in trip.status;
}

function isCancelledOrOther(trip: Trip): boolean {
  return '#cancelled' in trip.status || '#requested' in trip.status;
}

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

function formatDate(timestamp: bigint): string {
  try {
    const ms = Number(timestamp) / 1_000_000;
    return new Date(ms).toLocaleString();
  } catch {
    return '—';
  }
}

interface TripCardProps {
  trip: Trip;
  showComplete?: boolean;
}

function TripCard({ trip, showComplete }: TripCardProps) {
  const completeTrip = useCompleteTrip();

  return (
    <Card className="border">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Badge variant={getStatusVariant(trip)}>{getStatusLabel(trip)}</Badge>
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
          <div className="flex flex-col items-end gap-2 shrink-0">
            {Number(trip.totalFare) > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Fare</p>
                <p className="font-semibold">₹{Number(trip.totalFare)}</p>
              </div>
            )}
            {showComplete && (
              <Button
                size="sm"
                onClick={() => completeTrip.mutate(trip.tripId)}
                disabled={completeTrip.isPending}
              >
                {completeTrip.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Complete
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DriverTripList() {
  const { data: allTrips, isLoading } = useGetAllTrips();
  const { identity } = useInternetIdentity();

  const callerPrincipal = identity?.getPrincipal().toString();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  // Filter trips where driverId matches the current driver's principal.
  // driverId is typed as [] | [Principal] (Candid optional array).
  const myTrips = (allTrips ?? []).filter((trip) => {
    if (!callerPrincipal) return false;
    const d = trip.driverId;
    // d is always [] | [Principal] — handle only the array form
    if (!Array.isArray(d) || d.length === 0) return false;
    const driverPrincipal = d[0];
    if (!driverPrincipal) return false;
    return driverPrincipal.toString() === callerPrincipal;
  });

  if (myTrips.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No trips yet.</p>
        <p className="text-sm mt-1">Accept a trip from the Available Trips tab.</p>
      </div>
    );
  }

  const currentTrips = myTrips.filter(isAccepted);
  const completedTrips = myTrips
    .filter(isCompleted)
    .sort((a, b) => Number(b.createdTime) - Number(a.createdTime));
  const otherTrips = myTrips.filter(isCancelledOrOther);

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-6 pr-3">
        {currentTrips.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Current Trip
            </h3>
            <div className="space-y-3">
              {currentTrips.map((trip) => (
                <TripCard key={trip.tripId} trip={trip} showComplete />
              ))}
            </div>
          </div>
        )}

        {completedTrips.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Completed Trips
            </h3>
            <div className="space-y-3">
              {completedTrips.map((trip) => (
                <TripCard key={trip.tripId} trip={trip} />
              ))}
            </div>
          </div>
        )}

        {otherTrips.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Other
            </h3>
            <div className="space-y-3">
              {otherTrips.map((trip) => (
                <TripCard key={trip.tripId} trip={trip} />
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
