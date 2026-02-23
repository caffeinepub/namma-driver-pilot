import { useGetRequestedTrips, useAcceptTrip } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import type { Location } from '../backend';

function formatLocation(location: Location | undefined): string {
  if (!location) return 'N/A';
  return `${location.area}, ${location.pincode}`;
}

export default function AvailableTripsSection() {
  const { data: trips, isLoading } = useGetRequestedTrips();
  const acceptTrip = useAcceptTrip();

  const handleAccept = async (tripId: string) => {
    try {
      await acceptTrip.mutateAsync(tripId);
      toast.success('Trip accepted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept trip');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!trips || trips.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No available trips at the moment. Check back soon!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-4">
        {trips.map((trip) => (
          <div key={trip.tripId} className="border border-border rounded-lg p-4 space-y-3 bg-card">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Pickup</p>
                  <p className="text-sm text-muted-foreground">{formatLocation(trip.pickupLocation)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Dropoff</p>
                  <p className="text-sm text-muted-foreground">{formatLocation(trip.dropoffLocation)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(Number(trip.createdTime) / 1000000).toLocaleString()}
            </div>
            <Button
              onClick={() => handleAccept(trip.tripId)}
              disabled={acceptTrip.isPending}
              className="w-full"
            >
              {acceptTrip.isPending ? 'Accepting...' : 'Accept Trip'}
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
