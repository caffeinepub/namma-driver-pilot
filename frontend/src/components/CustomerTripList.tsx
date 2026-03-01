import type { Trip } from '../lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Clock, Car } from 'lucide-react';

interface CustomerTripListProps {
  trips?: Trip[];
  isLoading?: boolean;
}

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

function getVehicleLabel(trip: Trip): string {
  const v = trip.vehicleType;
  if ('#hatchback' in v) return 'Hatchback';
  if ('#sedan' in v) return 'Sedan';
  if ('#suv' in v) return 'SUV';
  if ('#luxury' in v) return 'Luxury';
  return 'Vehicle';
}

export default function CustomerTripList({ trips, isLoading }: CustomerTripListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (!trips || trips.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Car className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>No trips yet.</p>
        <p className="text-sm mt-1">Book your first ride to get started.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-3 pr-3">
        {trips.map((trip) => (
          <Card key={trip.tripId} className="border">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getStatusVariant(trip)}>
                      {getStatusLabel(trip)}
                    </Badge>
                    <Badge variant="outline">{getVehicleLabel(trip)}</Badge>
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
                {Number(trip.totalFare) > 0 && (
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">Fare</p>
                    <p className="font-semibold">₹{Number(trip.totalFare)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
