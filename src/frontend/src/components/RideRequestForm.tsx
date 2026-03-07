import type { JourneyType, TripType, VehicleType } from "@/backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateTrip, useGetPricingConfig } from "@/hooks/useQueries";
import { DEFAULT_CONFIG } from "@/lib/defaultConfig";
import type { NormalizedTrip } from "@/utils/normalizeTrip";
import {
  Car,
  Clock,
  IndianRupee,
  Info,
  Landmark,
  MapPin,
  Navigation,
  Phone,
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";

interface LocationState {
  area: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
}

interface RideRequestFormProps {
  onTripCreated?: (trip: NormalizedTrip) => void;
}

type LocationMode = "manual" | "gps";
type TripTypeValue = "local" | "outstation";
type JourneyTypeValue = "oneWay" | "roundTrip";
type VehicleTypeValue = "hatchback" | "sedan" | "suv" | "luxury";
type DurationUnit = "hours" | "days";

const emptyLocation = (): LocationState => ({
  area: "",
  pincode: "",
  latitude: null,
  longitude: null,
});

// ── Mock Bangalore pincode → [lat, lng] centers ───────────────────────────
const PINCODE_COORDS: Record<string, [number, number]> = {
  "560001": [12.9716, 77.5946],
  "560002": [12.98, 77.58],
  "560003": [12.99, 77.57],
  "560004": [12.96, 77.56],
  "560005": [12.95, 77.55],
  "560006": [12.94, 77.54],
  "560007": [12.93, 77.53],
  "560008": [12.92, 77.52],
  "560010": [12.91, 77.61],
  "560011": [12.905, 77.62],
  "560012": [12.9, 77.63],
  "560013": [12.895, 77.64],
  "560016": [12.9716, 77.646],
  "560017": [13.01, 77.55],
  "560018": [13.02, 77.54],
  "560019": [13.03, 77.53],
  "560020": [12.94, 77.6],
  "560021": [12.93, 77.61],
  "560022": [12.92, 77.62],
  "560023": [12.91, 77.63],
  "560024": [12.9, 77.64],
  "560025": [12.89, 77.65],
  "560026": [12.88, 77.66],
  "560027": [12.87, 77.67],
  "560028": [12.86, 77.68],
  "560029": [12.85, 77.69],
  "560030": [12.84, 77.7],
  "560032": [13.02, 77.62],
  "560033": [13.03, 77.63],
  "560034": [13.0, 77.6],
  "560035": [12.97, 77.68],
  "560036": [12.96, 77.69],
  "560037": [12.95, 77.7],
  "560038": [12.94, 77.71],
  "560040": [13.04, 77.62],
  "560041": [13.05, 77.61],
  "560042": [13.06, 77.6],
  "560043": [13.07, 77.59],
  "560045": [12.9, 77.5],
  "560046": [12.89, 77.51],
  "560047": [12.88, 77.52],
  "560048": [12.87, 77.53],
  "560050": [13.01, 77.65],
  "560051": [13.02, 77.66],
  "560052": [13.03, 77.67],
  "560053": [13.04, 77.68],
  "560054": [12.92, 77.51],
  "560055": [12.91, 77.52],
  "560056": [12.9, 77.53],
  "560057": [12.89, 77.54],
  "560058": [12.88, 77.55],
  "560059": [12.87, 77.56],
  "560060": [13.05, 77.56],
  "560061": [13.06, 77.57],
  "560062": [13.07, 77.58],
  "560063": [13.08, 77.59],
  "560064": [13.09, 77.6],
  "560065": [13.1, 77.61],
  "560066": [13.11, 77.62],
  "560067": [13.12, 77.63],
  "560068": [13.13, 77.64],
  "560069": [13.14, 77.65],
  "560070": [13.15, 77.66],
  "560071": [13.16, 77.67],
  "560072": [13.17, 77.68],
  "560073": [13.18, 77.69],
  "560074": [13.19, 77.7],
  "560075": [13.2, 77.71],
  "560076": [12.86, 77.57],
  "560077": [12.85, 77.58],
  "560078": [12.84, 77.59],
  "560079": [12.83, 77.6],
  "560080": [12.82, 77.61],
  "560085": [12.93, 77.72],
  "560086": [12.92, 77.73],
  "560087": [12.91, 77.74],
  "560088": [12.9, 77.75],
  "560089": [12.89, 77.76],
  "560090": [12.88, 77.77],
  "560091": [12.925, 77.666],
  "560092": [12.915, 77.676],
  "560093": [12.905, 77.686],
  "560094": [12.895, 77.696],
  "560095": [12.885, 77.706],
  "560096": [12.875, 77.716],
  "560097": [12.865, 77.726],
  "560098": [12.855, 77.736],
  "560099": [12.845, 77.746],
  "560100": [12.835, 77.756],
  "560102": [13.06, 77.52],
  "560103": [13.07, 77.51],
  "560104": [13.08, 77.5],
  "560105": [13.09, 77.49],
  "560106": [13.1, 77.48],
};

/** Haversine distance in km */
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Reverse-lookup: given lat/lng, find nearest pincode from PINCODE_COORDS */
function reverseLookupPincode(lat: number, lng: number): string {
  let bestPin = "";
  let bestDist = Number.POSITIVE_INFINITY;
  for (const [pin, [plat, plng]] of Object.entries(PINCODE_COORDS)) {
    const d = haversineKm(lat, lng, plat, plng);
    if (d < bestDist) {
      bestDist = d;
      bestPin = pin;
    }
  }
  return bestPin;
}

/** Mock distance between two pincodes; same pincode → 15km */
function getOutstationKm(pickupPin: string, dropPin: string): number {
  if (pickupPin === dropPin || !pickupPin || !dropPin) return 15;
  const p = PINCODE_COORDS[pickupPin];
  const d = PINCODE_COORDS[dropPin];
  if (!p || !d) return 15;
  return Math.max(1, Math.round(haversineKm(p[0], p[1], d[0], d[1])));
}

/** KM slab charge */
function kmSlabCharge(
  km: number,
  slab1: number,
  slab2: number,
  slab3: number,
  r1: number,
  r2: number,
  r3: number,
  r4: number,
): { charge: number; rate: number } {
  if (km <= slab1) return { charge: Math.round(km * r1), rate: r1 };
  if (km <= slab2) return { charge: Math.round(km * r2), rate: r2 };
  if (km <= slab3) return { charge: Math.round(km * r3), rate: r3 };
  return { charge: Math.round(km * r4), rate: r4 };
}

export default function RideRequestForm({
  onTripCreated,
}: RideRequestFormProps) {
  const createTripMutation = useCreateTrip();

  // Trip meta
  const [tripType, setTripType] = useState<TripTypeValue>("local");
  const [journeyType, setJourneyType] = useState<JourneyTypeValue>("oneWay");
  const [vehicleType, setVehicleType] = useState<VehicleTypeValue>("sedan");
  const [durationValue, setDurationValue] = useState<string>("4");
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("hours");
  const [phone, setPhone] = useState("");
  const [landmark, setLandmark] = useState("");
  const [startDateTime, setStartDateTime] = useState("");

  // Return fields — Outstation + Round Trip only
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");

  // Pickup location
  const [pickupLocation, setPickupLocation] = useState<LocationState>(
    emptyLocation(),
  );
  const [pickupMode, setPickupMode] = useState<LocationMode>("manual");
  const [pickupGpsLoading, setPickupGpsLoading] = useState(false);
  const [pickupGpsError, setPickupGpsError] = useState("");

  // Drop location (used for One Way AND Round Trip GPS detection)
  const [dropLocation, setDropLocation] = useState<LocationState>(
    emptyLocation(),
  );
  const [dropMode, setDropMode] = useState<LocationMode>("manual");
  const [dropGpsLoading, setDropGpsLoading] = useState(false);
  const [dropGpsError, setDropGpsError] = useState("");

  const [formError, setFormError] = useState("");

  // Pricing
  const { data: pricingData } = useGetPricingConfig();
  const pricing = pricingData ?? DEFAULT_CONFIG;

  const isRoundTrip = journeyType === "roundTrip";
  const isOutstation = tripType === "outstation";

  // For pricing: in Round Trip, use drop GPS pincode if captured, else pickup pincode
  const effectiveDropPincodeForPricing = isRoundTrip
    ? dropLocation.pincode.trim() || pickupLocation.pincode.trim() || "560001"
    : dropLocation.pincode.trim() || "560001";

  const priceEstimate = useMemo(() => {
    const durationNum = Number.parseInt(durationValue, 10);
    if (Number.isNaN(durationNum) || durationNum < 1) return null;

    const vehicleMultiplier = (() => {
      if (vehicleType === "hatchback")
        return Number(pricing.vehicle_multiplier.hatchback);
      if (vehicleType === "sedan")
        return Number(pricing.vehicle_multiplier.sedan);
      if (vehicleType === "suv") return Number(pricing.vehicle_multiplier.suv);
      if (vehicleType === "luxury")
        return Number(pricing.vehicle_multiplier.luxury);
      return 1.0;
    })();

    if (tripType === "local") {
      // Local pricing unchanged
      const baseHour = Number(pricing.local.base_first_hour);
      const perMin = Number(pricing.local.per_min_after_first_hour);
      const totalHours =
        durationUnit === "hours" ? durationNum : durationNum * 24;
      const extraMins = Math.max(0, (totalHours - 1) * 60);
      const base = baseHour * vehicleMultiplier;
      const extra = extraMins * perMin;
      const total = Math.round(base + extra);
      if (totalHours <= 1) {
        return { total, label: `₹${total} (${durationNum}hr base)` };
      }
      return {
        total,
        label: `₹${total} (1hr base ₹${Math.round(base)} + ${Math.round(extraMins)}min @ ₹${perMin}/min)`,
      };
    }

    // ── OUTSTATION: KM-based pricing ─────────────────────────────────────
    const days =
      durationUnit === "days" ? durationNum : Math.ceil(durationNum / 24);

    const pickupPin = pickupLocation.pincode.trim() || "560001";
    const dropPin = effectiveDropPincodeForPricing;

    let km = getOutstationKm(pickupPin, dropPin);
    if (isRoundTrip) km = km * 2; // round trip = 2× distance

    const slab1 = Number(pricing.outstation.km_slab_1_limit);
    const slab2 = Number(pricing.outstation.km_slab_2_limit);
    const slab3 = Number(pricing.outstation.km_slab_3_limit);
    const r1 = Number(pricing.outstation.per_km_slab_1);
    const r2 = Number(pricing.outstation.per_km_slab_2);
    const r3 = Number(pricing.outstation.per_km_slab_3);
    const r4 = Number(pricing.outstation.per_km_slab_4);

    const { charge: kmCharge, rate: slabRate } = kmSlabCharge(
      km,
      slab1,
      slab2,
      slab3,
      r1,
      r2,
      r3,
      r4,
    );

    const bata = Number(pricing.outstation.driver_bata_per_day);
    const bataTotal = Math.round(days * bata);
    const total = Math.round((kmCharge + bataTotal) * vehicleMultiplier);

    return {
      total,
      label: `₹${total} (${km}km @ ₹${slabRate}/km + ${days}days @ ₹${bata}/day)`,
    };
  }, [
    tripType,
    isRoundTrip,
    durationValue,
    durationUnit,
    vehicleType,
    pricing,
    pickupLocation.pincode,
    effectiveDropPincodeForPricing,
  ]);

  // When journey type changes to roundTrip, clear drop GPS error only
  useEffect(() => {
    if (journeyType === "roundTrip") {
      setDropGpsError("");
    }
  }, [journeyType]);

  /**
   * GPS capture with pincode reverse-lookup.
   * After capturing lat/lng, also fills in the nearest pincode.
   */
  const captureGpsWithPincode = (
    setLocation: React.Dispatch<React.SetStateAction<LocationState>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setError: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const pin = reverseLookupPincode(lat, lng);
        setLocation((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          pincode: pin || prev.pincode,
        }));
        setLoading(false);
      },
      (err) => {
        setError(`Unable to retrieve location: ${err.message}`);
        setLoading(false);
      },
    );
  };

  const handlePickupModeChange = (mode: LocationMode) => {
    setPickupMode(mode);
    // Do NOT clear any values — only switch visibility
  };

  const handleDropModeChange = (mode: LocationMode) => {
    setDropMode(mode);
    // Do NOT clear any values — only switch visibility
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Validate pickup
    if (pickupMode === "manual") {
      if (!pickupLocation.area.trim() || !pickupLocation.pincode.trim()) {
        setFormError("Please fill in Pickup Area and Pincode.");
        return;
      }
    } else {
      if (
        pickupLocation.latitude === null ||
        pickupLocation.longitude === null
      ) {
        setFormError("Please capture GPS for Pickup location.");
        return;
      }
    }

    // Validate drop (only for One Way — Round Trip auto-sets drop = pickup)
    if (journeyType === "oneWay") {
      if (dropMode === "manual") {
        if (!dropLocation.area.trim() || !dropLocation.pincode.trim()) {
          setFormError("Please fill in Drop Area and Pincode.");
          return;
        }
      } else {
        if (dropLocation.latitude === null || dropLocation.longitude === null) {
          setFormError("Please capture GPS for Drop location.");
          return;
        }
      }
    }

    if (!phone.trim()) {
      setFormError("Please enter a phone number.");
      return;
    }

    const durationNum = Number.parseInt(durationValue, 10);
    if (Number.isNaN(durationNum) || durationNum < 1) {
      setFormError("Please enter a valid duration.");
      return;
    }

    // For Round Trip: drop = pickup for submission (GPS drop is for pricing only)
    const effectiveDropLocation: LocationState =
      journeyType === "roundTrip" ? { ...pickupLocation } : { ...dropLocation };

    const tripId = `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const pickupBackend = {
      area: pickupLocation.area,
      pincode: pickupLocation.pincode,
      latitude:
        pickupLocation.latitude !== null ? pickupLocation.latitude : undefined,
      longitude:
        pickupLocation.longitude !== null
          ? pickupLocation.longitude
          : undefined,
    };

    const dropBackend = {
      area: effectiveDropLocation.area,
      pincode: effectiveDropLocation.pincode,
      latitude:
        effectiveDropLocation.latitude !== null
          ? effectiveDropLocation.latitude
          : undefined,
      longitude:
        effectiveDropLocation.longitude !== null
          ? effectiveDropLocation.longitude
          : undefined,
    };

    const duration =
      durationUnit === "hours"
        ? { __kind__: "hours" as const, hours: BigInt(durationNum) }
        : { __kind__: "days" as const, days: BigInt(durationNum) };

    const startTs = startDateTime
      ? BigInt(new Date(startDateTime).getTime()) * BigInt(1_000_000)
      : undefined;

    try {
      const result = await createTripMutation.mutateAsync({
        tripId,
        customerId: undefined,
        driverId: undefined,
        tripType: tripType as unknown as TripType,
        journeyType: journeyType as unknown as JourneyType,
        vehicleType: vehicleType as unknown as VehicleType,
        duration,
        startDateTime: startTs,
        endDateTime: undefined,
        pickupLocation: pickupBackend,
        dropoffLocation: dropBackend,
        phone: phone.trim(),
        landmark: landmark.trim() || undefined,
        totalFare: BigInt(0),
        ratePerHour: BigInt(0),
        billableHours: BigInt(0),
      });

      if (onTripCreated && result) {
        const normalized: NormalizedTrip = {
          tripId: result.tripId,
          customerId: result.customerId,
          driverId: result.driverId ?? null,
          tripType: tripType,
          journeyType: journeyType,
          vehicleType: vehicleType,
          duration: result.duration,
          startDateTime: result.startDateTime ?? null,
          endDateTime: result.endDateTime ?? null,
          pickupLocation: result.pickupLocation,
          dropoffLocation: result.dropoffLocation ?? null,
          phone: result.phone,
          landmark: result.landmark ?? null,
          status: "requested",
          createdTime: result.createdTime,
          totalFare: result.totalFare,
          ratePerHour: result.ratePerHour,
          billableHours: result.billableHours,
        };
        onTripCreated(normalized);
      }

      // Reset form
      setPickupLocation(emptyLocation());
      setDropLocation(emptyLocation());
      setPickupMode("manual");
      setDropMode("manual");
      setPhone("");
      setLandmark("");
      setStartDateTime("");
      setDurationValue("4");
      setReturnDate("");
      setReturnTime("");
    } catch (err: unknown) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to create trip. Please try again.",
      );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Car className="h-5 w-5 text-primary" />
          Book a Ride
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Trip Type + Journey Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Trip Type</Label>
              <Select
                value={tripType}
                onValueChange={(v) => setTripType(v as TripTypeValue)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="outstation">Outstation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Journey Type</Label>
              <Select
                value={journeyType}
                onValueChange={(v) => setJourneyType(v as JourneyTypeValue)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oneWay">One Way</SelectItem>
                  <SelectItem value="roundTrip">Round Trip</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Journey Type Helper Text */}
          {journeyType === "oneWay" && (
            <div className="flex items-start gap-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3 py-2 text-sm text-blue-700 dark:text-blue-300">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <span>One-way: Pickup and Drop can be different locations.</span>
            </div>
          )}
          {journeyType === "roundTrip" && (
            <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Round trip: Drop location is same as Pickup. Optionally detect
                drop area GPS for accurate distance pricing.
              </span>
            </div>
          )}

          {/* Vehicle Type */}
          <div className="space-y-1">
            <Label>Vehicle Type</Label>
            <Select
              value={vehicleType}
              onValueChange={(v) => setVehicleType(v as VehicleTypeValue)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hatchback">Hatchback</SelectItem>
                <SelectItem value="sedan">Sedan</SelectItem>
                <SelectItem value="suv">SUV</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Duration
              </Label>
              <Input
                type="number"
                min="1"
                value={durationValue}
                onChange={(e) => setDurationValue(e.target.value)}
                placeholder="e.g. 4"
              />
            </div>
            <div className="space-y-1">
              <Label>Unit</Label>
              <Select
                value={durationUnit}
                onValueChange={(v) => setDurationUnit(v as DurationUnit)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start Date/Time */}
          <div className="space-y-1">
            <Label>Start Date &amp; Time</Label>
            <Input
              type="datetime-local"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
            />
          </div>

          {/* Return Date + Time — Outstation Round Trip only */}
          {isOutstation && isRoundTrip && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Return Date</Label>
                <Input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  data-ocid="booking.return_date.input"
                />
              </div>
              <div className="space-y-1">
                <Label>Return Time</Label>
                <Input
                  type="time"
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  data-ocid="booking.return_time.input"
                />
              </div>
            </div>
          )}

          {/* ── PICKUP LOCATION ── */}
          <div className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1 font-semibold">
                <MapPin className="h-4 w-4 text-primary" /> Pickup Location
              </Label>
              {/* Pickup Mode Toggle */}
              <div className="flex rounded-md overflow-hidden border border-border text-xs">
                <button
                  type="button"
                  onClick={() => handlePickupModeChange("manual")}
                  className={`px-3 py-1 transition-colors ${
                    pickupMode === "manual"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => handlePickupModeChange("gps")}
                  className={`px-3 py-1 transition-colors ${
                    pickupMode === "gps"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  GPS
                </button>
              </div>
            </div>

            {/* GPS capture button — shown when GPS mode */}
            {pickupMode === "gps" && (
              <div className="space-y-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    captureGpsWithPincode(
                      setPickupLocation,
                      setPickupGpsLoading,
                      setPickupGpsError,
                    )
                  }
                  disabled={pickupGpsLoading}
                  className="w-full"
                  data-ocid="booking.pickup_gps.button"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  {pickupGpsLoading
                    ? "Capturing..."
                    : pickupLocation.latitude !== null
                      ? "Re-capture GPS"
                      : "Detect Pickup Location"}
                </Button>
                {pickupLocation.latitude !== null && (
                  <p className="text-xs text-muted-foreground text-center">
                    📍 {pickupLocation.latitude.toFixed(5)},{" "}
                    {pickupLocation.longitude?.toFixed(5)}
                    {pickupLocation.pincode
                      ? ` · Pincode: ${pickupLocation.pincode}`
                      : ""}
                  </p>
                )}
                {pickupGpsError && (
                  <p className="text-xs text-destructive">{pickupGpsError}</p>
                )}
              </div>
            )}

            {/* Manual fields — hidden when GPS mode, values preserved in state */}
            {pickupMode === "manual" && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Area</Label>
                  <Input
                    placeholder="Area / Locality"
                    value={pickupLocation.area}
                    onChange={(e) =>
                      setPickupLocation((prev) => ({
                        ...prev,
                        area: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Pincode</Label>
                  <Input
                    placeholder="6-digit pincode"
                    value={pickupLocation.pincode}
                    onChange={(e) =>
                      setPickupLocation((prev) => ({
                        ...prev,
                        pincode: e.target.value,
                      }))
                    }
                    maxLength={6}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── DROP LOCATION ── */}
          {/* One Way: full drop section with Manual/GPS toggle */}
          {!isRoundTrip && (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1 font-semibold">
                  <MapPin className="h-4 w-4 text-destructive" /> Drop Location
                </Label>
                {/* Drop Mode Toggle — only in One Way */}
                <div className="flex rounded-md overflow-hidden border border-border text-xs">
                  <button
                    type="button"
                    onClick={() => handleDropModeChange("manual")}
                    className={`px-3 py-1 transition-colors ${
                      dropMode === "manual"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Manual
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDropModeChange("gps")}
                    className={`px-3 py-1 transition-colors ${
                      dropMode === "gps"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    GPS
                  </button>
                </div>
              </div>

              {/* Drop GPS capture */}
              {dropMode === "gps" && (
                <div className="space-y-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      captureGpsWithPincode(
                        setDropLocation,
                        setDropGpsLoading,
                        setDropGpsError,
                      )
                    }
                    disabled={dropGpsLoading}
                    className="w-full"
                    data-ocid="booking.drop_gps.button"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    {dropGpsLoading
                      ? "Capturing..."
                      : dropLocation.latitude !== null
                        ? "Re-capture GPS"
                        : "Detect Drop Location"}
                  </Button>
                  {dropLocation.latitude !== null && (
                    <p className="text-xs text-muted-foreground text-center">
                      📍 {dropLocation.latitude.toFixed(5)},{" "}
                      {dropLocation.longitude?.toFixed(5)}
                      {dropLocation.pincode
                        ? ` · Pincode: ${dropLocation.pincode}`
                        : ""}
                    </p>
                  )}
                  {dropGpsError && (
                    <p className="text-xs text-destructive">{dropGpsError}</p>
                  )}
                </div>
              )}

              {/* Drop manual fields — hidden when GPS mode, values preserved in state */}
              {dropMode === "manual" && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Area</Label>
                    <Input
                      placeholder="Area / Locality"
                      value={dropLocation.area}
                      onChange={(e) =>
                        setDropLocation((prev) => ({
                          ...prev,
                          area: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Pincode</Label>
                    <Input
                      placeholder="6-digit pincode"
                      value={dropLocation.pincode}
                      onChange={(e) =>
                        setDropLocation((prev) => ({
                          ...prev,
                          pincode: e.target.value,
                        }))
                      }
                      maxLength={6}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ROUND TRIP: GPS drop detection for accurate distance pricing ── */}
          {isRoundTrip && isOutstation && (
            <div className="space-y-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 p-3">
              <Label className="flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-300 text-sm">
                <MapPin className="h-4 w-4" /> Drop Area (for distance estimate)
              </Label>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Drop is set to Pickup for booking. Detect drop area GPS to
                calculate accurate outstation distance.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  captureGpsWithPincode(
                    setDropLocation,
                    setDropGpsLoading,
                    setDropGpsError,
                  )
                }
                disabled={dropGpsLoading}
                className="w-full border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300"
                data-ocid="booking.roundtrip_drop_gps.button"
              >
                <Navigation className="h-4 w-4 mr-2" />
                {dropGpsLoading
                  ? "Capturing..."
                  : dropLocation.latitude !== null
                    ? `Re-detect · Pincode: ${dropLocation.pincode}`
                    : "Detect Drop Location (GPS)"}
              </Button>
              {dropLocation.latitude !== null && (
                <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
                  📍 {dropLocation.latitude.toFixed(5)},{" "}
                  {dropLocation.longitude?.toFixed(5)}
                  {dropLocation.pincode
                    ? ` · Pincode: ${dropLocation.pincode}`
                    : ""}
                </p>
              )}
              {/* Manual pincode fallback for round trip distance */}
              <div className="space-y-1">
                <Label className="text-xs text-amber-800 dark:text-amber-400">
                  Or enter drop pincode manually (for pricing only):
                </Label>
                <Input
                  placeholder="Drop pincode (optional)"
                  value={dropLocation.pincode}
                  onChange={(e) =>
                    setDropLocation((prev) => ({
                      ...prev,
                      pincode: e.target.value,
                    }))
                  }
                  maxLength={6}
                  className="border-amber-300 dark:border-amber-600"
                />
              </div>
              {dropGpsError && (
                <p className="text-xs text-destructive">{dropGpsError}</p>
              )}
            </div>
          )}

          {/* Round Trip Local: GPS drop for pricing */}
          {isRoundTrip && !isOutstation && (
            <div className="space-y-2 rounded-lg border border-dashed border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3">
              <Label className="flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-300 text-sm">
                <MapPin className="h-4 w-4" /> Drop Area GPS (optional)
              </Label>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Drop is same as Pickup. GPS detection is optional for local
                round trips.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  captureGpsWithPincode(
                    setDropLocation,
                    setDropGpsLoading,
                    setDropGpsError,
                  )
                }
                disabled={dropGpsLoading}
                className="w-full border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300"
                data-ocid="booking.local_roundtrip_drop_gps.button"
              >
                <Navigation className="h-4 w-4 mr-2" />
                {dropGpsLoading
                  ? "Capturing..."
                  : dropLocation.latitude !== null
                    ? `Re-detect · ${dropLocation.pincode || "captured"}`
                    : "Detect Drop Location (GPS)"}
              </Button>
              {dropLocation.latitude !== null && (
                <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
                  📍 {dropLocation.latitude.toFixed(5)},{" "}
                  {dropLocation.longitude?.toFixed(5)}
                  {dropLocation.pincode
                    ? ` · Pincode: ${dropLocation.pincode}`
                    : ""}
                </p>
              )}
              {dropGpsError && (
                <p className="text-xs text-destructive">{dropGpsError}</p>
              )}
            </div>
          )}

          {/* Phone */}
          <div className="space-y-1">
            <Label className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" /> Phone Number
            </Label>
            <Input
              type="tel"
              placeholder="Your contact number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Landmark */}
          <div className="space-y-1">
            <Label className="flex items-center gap-1">
              <Landmark className="h-3.5 w-3.5" /> Landmark (optional)
            </Label>
            <Input
              placeholder="Nearby landmark"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
            />
          </div>

          {/* Error */}
          {formError && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {formError}
            </p>
          )}

          {/* Price Estimate */}
          {priceEstimate && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-3 py-2 text-sm text-green-800 dark:text-green-300">
              <IndianRupee className="h-4 w-4 shrink-0" />
              <span className="font-medium">Est: {priceEstimate.label}</span>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={createTripMutation.isPending}
            data-ocid="booking.submit_button"
          >
            {createTripMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Booking...
              </span>
            ) : (
              "Book Ride"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
