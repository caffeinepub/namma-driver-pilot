import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, Clock, MapPin } from "lucide-react";
import type { NormalizedTrip } from "../utils/normalizeTrip";

interface CustomerTripListProps {
  trips?: NormalizedTrip[];
  isLoading?: boolean;
}

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

function getVehicleLabel(vehicleType: string): string {
  if (vehicleType === "hatchback") return "Hatchback";
  if (vehicleType === "sedan") return "Sedan";
  if (vehicleType === "suv") return "SUV";
  if (vehicleType === "luxury") return "Luxury";
  return "Vehicle";
}

export default function CustomerTripList({
  trips,
  isLoading,
}: CustomerTripListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {["s1", "s2", "s3"].map((k) => (
          <Skeleton key={k} className="h-28 w-full" />
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
                    <Badge variant={getStatusVariant(trip.status)}>
                      {getStatusLabel(trip.status)}
                    </Badge>
                    <Badge variant="outline">
                      {getVehicleLabel(trip.vehicleType)}
                    </Badge>
                  </div>
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
                        <span className="text-muted-foreground text-xs">
                          Drop:{" "}
                        </span>
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
