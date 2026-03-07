import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { NormalizedTrip } from "@/utils/normalizeTrip";
import { Car, Clock, MapPin, Navigation, User } from "lucide-react";
import type React from "react";

interface TripCardProps {
  trip: NormalizedTrip;
  actions?: React.ReactNode;
}

function getStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "requested":
      return "secondary";
    case "accepted":
      return "default";
    case "completed":
      return "outline";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "requested":
      return "Requested";
    case "accepted":
      return "Accepted";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function getTripTypeLabel(tripType: string): string {
  switch (tripType) {
    case "local":
      return "Local";
    case "outstation":
      return "Outstation";
    default:
      return tripType;
  }
}

function getJourneyTypeLabel(journeyType: string): string {
  switch (journeyType) {
    case "oneWay":
      return "One way";
    case "roundTrip":
      return "Round trip";
    default:
      return journeyType;
  }
}

function getVehicleLabel(vehicleType: string): string {
  switch (vehicleType) {
    case "hatchback":
      return "Hatchback";
    case "sedan":
      return "Sedan";
    case "suv":
      return "SUV";
    case "luxury":
      return "Luxury";
    default:
      return vehicleType;
  }
}

function formatDuration(duration: NormalizedTrip["duration"]): string {
  if (!duration) return "";
  if (duration.__kind__ === "hours") {
    return `${duration.hours} hr${Number(duration.hours) !== 1 ? "s" : ""}`;
  }
  if (duration.__kind__ === "days") {
    return `${duration.days} day${Number(duration.days) !== 1 ? "s" : ""}`;
  }
  return "";
}

function formatDateTime(ts: bigint | undefined): string {
  if (!ts) return "";
  try {
    const ms = Number(ts) / 1_000_000;
    return new Date(ms).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

export default function TripCard({ trip, actions }: TripCardProps) {
  const tripTypeLabel = getTripTypeLabel(trip.tripType);
  const journeyTypeLabel = getJourneyTypeLabel(trip.journeyType);
  const classificationLabel = `${tripTypeLabel} • ${journeyTypeLabel}`;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={getStatusVariant(trip.status)}>
                {getStatusLabel(trip.status)}
              </Badge>
              {/* Trip Type • Journey Type label */}
              <Badge variant="outline" className="text-xs font-medium">
                {classificationLabel}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              #{trip.tripId.slice(-8)}
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Car className="h-4 w-4" />
            <span>{getVehicleLabel(trip.vehicleType)}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Duration */}
        {trip.duration && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{formatDuration(trip.duration)}</span>
            {trip.startDateTime && (
              <span className="text-muted-foreground">
                · {formatDateTime(trip.startDateTime)}
              </span>
            )}
          </div>
        )}

        {/* Pickup */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Pickup</p>
            <p className="text-muted-foreground">
              {trip.pickupLocation?.area || "—"}
              {trip.pickupLocation?.pincode
                ? `, ${trip.pickupLocation.pincode}`
                : ""}
            </p>
            {trip.pickupLocation?.latitude != null && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Navigation className="h-3 w-3" />
                {trip.pickupLocation.latitude.toFixed(4)},{" "}
                {trip.pickupLocation.longitude?.toFixed(4)}
              </p>
            )}
          </div>
        </div>

        {/* Drop */}
        {trip.dropoffLocation && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Drop</p>
              <p className="text-muted-foreground">
                {trip.dropoffLocation.area || "—"}
                {trip.dropoffLocation.pincode
                  ? `, ${trip.dropoffLocation.pincode}`
                  : ""}
              </p>
              {trip.dropoffLocation.latitude != null && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Navigation className="h-3 w-3" />
                  {trip.dropoffLocation.latitude.toFixed(4)},{" "}
                  {trip.dropoffLocation.longitude?.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Phone intentionally hidden — no direct contact between parties */}

        {/* Driver */}
        {trip.driverId && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground text-xs font-mono">
              Driver: {trip.driverId.toString().slice(0, 12)}…
            </span>
          </div>
        )}

        {/* Fare */}
        {trip.totalFare !== undefined && Number(trip.totalFare) > 0 && (
          <div className="flex items-center justify-between text-sm border-t border-border pt-2">
            <span className="text-muted-foreground">Total Fare</span>
            <span className="font-semibold">₹{Number(trip.totalFare)}</span>
          </div>
        )}

        {/* Actions */}
        {actions && <div className="pt-1">{actions}</div>}
      </CardContent>
    </Card>
  );
}
