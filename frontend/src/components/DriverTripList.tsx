import { useGetMyTrips, useCompleteTrip } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MapPin, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { TripStatus } from '../backend';
import type { Trip, Location } from '../backend';

const statusColors: Record<TripStatus, string> = {
  requested: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  accepted: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  completed: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
  cancelled: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
};

const statusLabels: Record<TripStatus, string> = {
  requested: 'Pending',
  accepted: 'Accepted',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function formatLocation(location: Location | undefined): string {
  if (!location) return 'N/A';
  return `${location.area}, ${location.pincode}`;
}

interface TripCardProps {
  trip: Trip;
  showCompleteButton?: boolean;
  isCompletePending?: boolean;
  onComplete?: (tripId: string) => void;
}

function TripCard({ trip, showCompleteButton, isCompletePending, onComplete }: TripCardProps) {
  return (
    <div className="border border-border rounded-lg p-4 space-y-3 bg-card">
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
          {statusLabels[trip.status]}
        </Badge>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3" />
        {new Date(Number(trip.createdTime) / 1000000).toLocaleString()}
      </div>
      {showCompleteButton && onComplete && (
        <Button
          onClick={() => onComplete(trip.tripId)}
          disabled={isCompletePending}
          className="w-full"
          variant="default"
        >
          {isCompletePending ? 'Completing...' : 'Mark as Completed'}
        </Button>
      )}
    </div>
  );
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
        <p>No trips yet. Check the Available Trips tab!</p>
      </div>
    );
  }

  // Segment trips by status
  const currentTrip = trips.find((t) => t.status === TripStatus.accepted) ?? null;
  const completedTrips = trips
    .filter((t) => t.status === TripStatus.completed)
    .sort((a, b) => Number(b.createdTime) - Number(a.createdTime));
  const otherTrips = trips.filter(
    (t) => t.status !== TripStatus.accepted && t.status !== TripStatus.completed
  );

  return (
    <ScrollArea className="h-[560px] pr-4">
      <div className="space-y-6">

        {/* ── Current Trip ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Current Trip
            </h3>
          </div>
          {currentTrip ? (
            <TripCard
              trip={currentTrip}
              showCompleteButton
              isCompletePending={completeTrip.isPending}
              onComplete={handleComplete}
            />
          ) : (
            <p className="text-sm text-muted-foreground py-2 pl-1">
              No active trip right now.
            </p>
          )}
        </section>

        <Separator />

        {/* ── Completed Trips ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Completed Trips
            </h3>
            {completedTrips.length > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">
                {completedTrips.length} trip{completedTrips.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {completedTrips.length > 0 ? (
            <div className="space-y-3">
              {completedTrips.map((trip) => (
                <TripCard key={trip.tripId} trip={trip} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2 pl-1">
              No completed trips yet.
            </p>
          )}
        </section>

        {/* ── Other (Cancelled / Rejected) ── */}
        {otherTrips.length > 0 && (
          <>
            <Separator />
            <section>
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                  Other
                </h3>
                <span className="ml-auto text-xs text-muted-foreground">
                  {otherTrips.length} trip{otherTrips.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-3">
                {otherTrips.map((trip) => (
                  <TripCard key={trip.tripId} trip={trip} />
                ))}
              </div>
            </section>
          </>
        )}

      </div>
    </ScrollArea>
  );
}
