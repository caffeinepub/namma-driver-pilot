import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, Loader2, MapPin } from "lucide-react";
import { useCompleteTrip, useGetMyDriverTrips } from "../hooks/useQueries";
import type { NormalizedTrip } from "../utils/normalizeTrip";

function getStatusLabel(status: string): string {
  if (status === "requested") return "Pending";
  if (status === "accepted") return "Accepted";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return "Unknown";
}

function getStatusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "completed") return "default";
  if (status === "accepted") return "secondary";
  if (status === "cancelled") return "destructive";
  return "outline";
}

function formatLocation(loc: NormalizedTrip["pickupLocation"]): string {
  const parts = [loc.area, loc.pincode].filter(Boolean);
  return parts.join(", ") || "—";
}

function formatDropoff(loc: NormalizedTrip["dropoffLocation"]): string {
  if (!loc) return "—";
  const parts = [loc.area, loc.pincode].filter(Boolean);
  return parts.join(", ") || "—";
}

function formatDate(timestamp: bigint): string {
  try {
    const ms = Number(timestamp) / 1_000_000;
    return new Date(ms).toLocaleString();
  } catch {
    return "—";
  }
}

interface TripCardProps {
  trip: NormalizedTrip;
  showComplete?: boolean;
}

function TripCard({ trip, showComplete }: TripCardProps) {
  const completeTrip = useCompleteTrip();

  return (
    <Card className="border">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Badge variant={getStatusVariant(trip.status)}>
              {getStatusLabel(trip.status)}
            </Badge>
            <div className="space-y-1">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground text-xs">
                    Pickup:{" "}
                  </span>
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
  const { data: myTrips, isLoading } = useGetMyDriverTrips();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {["s1", "s2", "s3"].map((k) => (
          <Skeleton key={k} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  const trips = myTrips ?? [];

  if (trips.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No trips yet.</p>
        <p className="text-sm mt-1">
          Accept a trip from the Available Trips tab.
        </p>
      </div>
    );
  }

  const currentTrips = trips.filter((t) => t.status === "accepted");
  const completedTrips = trips
    .filter((t) => t.status === "completed")
    .sort((a, b) => Number(b.createdTime) - Number(a.createdTime));
  const otherTrips = trips.filter(
    (t) => t.status === "cancelled" || t.status === "requested",
  );

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
