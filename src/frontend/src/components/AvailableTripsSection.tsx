import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_CONFIG } from "@/lib/defaultConfig";
import { Car, Clock, IndianRupee, Loader2, MapPin } from "lucide-react";
import { useState } from "react";
import type { Trip as BackendTrip } from "../backend";
import {
  useAcceptTrip,
  useGetAvailableTripsForDriver,
  useGetPricingConfig,
} from "../hooks/useQueries";
import { type NormalizedTrip, normalizeTrip } from "../utils/normalizeTrip";

function formatLocation(loc: NormalizedTrip["pickupLocation"]): string {
  const parts = [loc.area, loc.pincode].filter(Boolean);
  return parts.join(", ") || "—";
}

function formatDropoff(loc: NormalizedTrip["dropoffLocation"]): string {
  if (!loc) return "—";
  const parts = [loc.area, loc.pincode].filter(Boolean);
  return parts.join(", ") || "—";
}

function getVehicleLabel(vehicleType: string): string {
  if (vehicleType === "hatchback") return "Hatchback";
  if (vehicleType === "sedan") return "Sedan";
  if (vehicleType === "suv") return "SUV";
  if (vehicleType === "luxury") return "Luxury";
  return "Vehicle";
}

function getTripTypeLabel(tripType: string): string {
  if (tripType === "local") return "Local";
  if (tripType === "outstation") return "Outstation";
  return "Trip";
}

function getJourneyTypeLabel(journeyType: string): string {
  if (journeyType === "oneWay") return "One Way";
  if (journeyType === "roundTrip") return "Round Trip";
  return journeyType;
}

function formatDuration(duration: NormalizedTrip["duration"]): string {
  if (!duration) return "—";
  const d = duration as { __kind__?: string; hours?: bigint; days?: bigint };
  if (d.__kind__ === "hours" && d.hours !== undefined) {
    return `${d.hours} hour${d.hours === BigInt(1) ? "" : "s"}`;
  }
  if (d.__kind__ === "days" && d.days !== undefined) {
    return `${d.days} day${d.days === BigInt(1) ? "" : "s"}`;
  }
  // fallback: variant object form
  const raw = duration as Record<string, unknown>;
  if ("hours" in raw) return `${raw.hours} hour(s)`;
  if ("days" in raw) return `${raw.days} day(s)`;
  return "—";
}

function formatDate(timestamp: bigint): string {
  try {
    const ms = Number(timestamp) / 1_000_000;
    return new Date(ms).toLocaleString();
  } catch {
    return "—";
  }
}

function calcPriceEstimate(
  trip: NormalizedTrip,
  pricing: typeof DEFAULT_CONFIG,
): string {
  const vehicleMultiplier = (() => {
    if (trip.vehicleType === "hatchback")
      return Number(pricing.vehicle_multiplier.hatchback);
    if (trip.vehicleType === "sedan")
      return Number(pricing.vehicle_multiplier.sedan);
    if (trip.vehicleType === "suv")
      return Number(pricing.vehicle_multiplier.suv);
    if (trip.vehicleType === "luxury")
      return Number(pricing.vehicle_multiplier.luxury);
    return 1.0;
  })();

  const dur = trip.duration as
    | { __kind__?: string; hours?: bigint; days?: bigint }
    | Record<string, unknown>;
  let totalHours = 1;
  const kind = (dur as { __kind__?: string }).__kind__;
  if (kind === "hours") {
    totalHours = Number((dur as { hours?: bigint }).hours ?? 1);
  } else if (kind === "days") {
    totalHours = Number((dur as { days?: bigint }).days ?? 1) * 24;
  } else if ("hours" in dur) {
    totalHours = Number((dur as Record<string, unknown>).hours ?? 1);
  } else if ("days" in dur) {
    totalHours = Number((dur as Record<string, unknown>).days ?? 1) * 24;
  }

  if (trip.tripType === "local") {
    const baseHour = Number(pricing.local.base_first_hour);
    const perMin = Number(pricing.local.per_min_after_first_hour);
    const extraMins = Math.max(0, (totalHours - 1) * 60);
    const base = baseHour * vehicleMultiplier;
    const extra = extraMins * perMin;
    const total = Math.round(base + extra);
    if (totalHours <= 1) return `₹${total} (${totalHours}hr base)`;
    return `₹${total} (1hr base ₹${Math.round(base)} + ${Math.round(extraMins)}min @ ₹${perMin}/min)`;
  }
  const days = Math.max(1, Math.ceil(totalHours / 24));
  const bata = Number(pricing.outstation.driver_bata_per_day);
  const total = Math.round(days * bata * vehicleMultiplier);
  return `₹${total} (${days}d × ₹${bata} bata × ${vehicleMultiplier}x vehicle)`;
}

interface TripDetailModalProps {
  trip: NormalizedTrip | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  pricing: typeof DEFAULT_CONFIG;
}

function TripDetailModal({
  trip,
  isOpen,
  onClose,
  onConfirm,
  isPending,
  pricing,
}: TripDetailModalProps) {
  if (!trip) return null;

  const estimate = calcPriceEstimate(trip, pricing);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm Trip Details</DialogTitle>
          <DialogDescription>
            Review the trip before accepting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {/* Type badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{getTripTypeLabel(trip.tripType)}</Badge>
            <Badge variant="secondary">
              {getJourneyTypeLabel(trip.journeyType)}
            </Badge>
            <Badge variant="secondary">
              {getVehicleLabel(trip.vehicleType)}
            </Badge>
          </div>

          {/* Pickup */}
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Pickup</p>
              <p className="font-medium">{trip.pickupLocation.area || "—"}</p>
              <p className="text-xs text-muted-foreground">
                Pincode: {trip.pickupLocation.pincode || "—"}
              </p>
            </div>
          </div>

          {/* Drop */}
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Drop</p>
              <p className="font-medium">{trip.dropoffLocation?.area || "—"}</p>
              {trip.dropoffLocation?.pincode && (
                <p className="text-xs text-muted-foreground">
                  Pincode: {trip.dropoffLocation.pincode}
                </p>
              )}
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-medium">{formatDuration(trip.duration)}</p>
            </div>
          </div>

          {/* Estimate */}
          <div className="flex items-start gap-2 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-3 py-2">
            <IndianRupee className="h-4 w-4 text-green-700 dark:text-green-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-green-700 dark:text-green-400">
                Price Estimate
              </p>
              <p className="font-semibold text-green-800 dark:text-green-300">
                {estimate}
              </p>
            </div>
          </div>

          {/* Phone hidden until trip started */}
          <p className="text-xs text-muted-foreground italic">
            Customer phone is shown only after trip is started.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            data-ocid="accept_trip_modal.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            data-ocid="accept_trip_modal.confirm_button"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Accepting...
              </>
            ) : (
              "Accept Trip"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AvailableTripsSection() {
  const { data: availableTrips, isLoading } = useGetAvailableTripsForDriver();
  const acceptTrip = useAcceptTrip();
  const { data: pricingData } = useGetPricingConfig();
  const pricing = pricingData ?? DEFAULT_CONFIG;

  const [selectedTrip, setSelectedTrip] = useState<NormalizedTrip | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleAcceptClick = (trip: NormalizedTrip) => {
    setSelectedTrip(trip);
    setModalOpen(true);
  };

  const handleConfirmAccept = () => {
    if (!selectedTrip) return;
    acceptTrip.mutate(selectedTrip.tripId, {
      onSuccess: () => {
        setModalOpen(false);
        setSelectedTrip(null);
      },
      onError: () => {
        setModalOpen(false);
        setSelectedTrip(null);
      },
    });
  };

  const handleModalClose = () => {
    if (acceptTrip.isPending) return;
    setModalOpen(false);
    setSelectedTrip(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {["s1", "s2", "s3"].map((k) => (
          <Skeleton key={k} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  // Normalize all trips through normalizeTrip() before rendering
  const trips: NormalizedTrip[] = (
    (availableTrips as BackendTrip[] | undefined) ?? []
  ).map((t) => normalizeTrip(t));

  if (trips.length === 0) {
    return (
      <>
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="available_trips.empty_state"
        >
          <Car className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No available trips right now.</p>
          <p className="text-sm mt-1">
            Check back soon for new ride requests in your service area.
          </p>
        </div>
        <TripDetailModal
          trip={selectedTrip}
          isOpen={modalOpen}
          onClose={handleModalClose}
          onConfirm={handleConfirmAccept}
          isPending={acceptTrip.isPending}
          pricing={pricing}
        />
      </>
    );
  }

  return (
    <>
      <ScrollArea className="h-[500px]">
        <div className="space-y-3 pr-3">
          {trips.map((trip, idx) => (
            <Card
              key={trip.tripId}
              className="border"
              data-ocid={`available_trips.item.${idx + 1}`}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">
                        {getTripTypeLabel(trip.tripType)}
                      </Badge>
                      <Badge variant="secondary">
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
                  <Button
                    size="sm"
                    onClick={() => handleAcceptClick(trip)}
                    disabled={acceptTrip.isPending}
                    data-ocid={`available_trips.item.${idx + 1}.button`}
                  >
                    Accept
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <TripDetailModal
        trip={selectedTrip}
        isOpen={modalOpen}
        onClose={handleModalClose}
        onConfirm={handleConfirmAccept}
        isPending={acceptTrip.isPending}
        pricing={pricing}
      />
    </>
  );
}
