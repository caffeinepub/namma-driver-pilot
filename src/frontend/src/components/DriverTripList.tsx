import { useGetMyTrips, useCompleteTrip } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import type { TripStatus, Location } from '../backend';

const statusColors: Record<TripStatus, string> = {
  requested: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  accepted: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  completed: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
  cancelled: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
};

function formatLocation(location: Location | undefined): string {
  if (!location) return 'N/A';
  return `${location.area}, ${location.pincode}`;
}

export default function DriverTripList() {
  const { data: trips, isLoading } = useGetMyTrips();
  const completeTrip = useCompleteTrip();

  const handleComplete = async (tripId: string) => {
    try {
      await completeTrip.mutateAsync(tripId);
      toast.success('Trip completed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete trip');
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
        <p>No accepted trips yet. Check the Available Trips tab!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-4">
        {trips.map((trip) => (
          <div key={trip.tripId} className="border border-border rounded-lg p-4 space-y-3 bg-card">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Pickup</p>
                    <p className="text-sm text-muted-foreground">{formatLocation(trip.pickupLocation)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Dropoff</p>
                    <p className="text-sm text-muted-foreground">{formatLocation(trip.dropoffLocation)}</p>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className={statusColors[trip.status]}>
                {trip.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(Number(trip.createdTime) / 1000000).toLocaleString()}
            </div>
            {trip.status === 'accepted' && (
              <Button
                onClick={() => handleComplete(trip.tripId)}
                disabled={completeTrip.isPending}
                className="w-full"
                variant="default"
              >
                {completeTrip.isPending ? 'Completing...' : 'Mark as Completed'}
              </Button>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
