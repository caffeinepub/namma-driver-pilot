import { useState } from 'react';
import { useCreateTrip } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import type { TripRequest } from '../backend';
import { TripType, JourneyType } from '../backend';

type TripTypeKey = 'local' | 'outstation';
type JourneyTypeKey = 'oneWay' | 'roundTrip';
type VehicleTypeKey = 'hatchback' | 'sedan' | 'suv' | 'luxury';
type LocationMode = 'manual' | 'gps';

export default function RideRequestForm() {
  const createTrip = useCreateTrip();

  const [tripType, setTripType] = useState<TripTypeKey>('local');
  const [journeyType, setJourneyType] = useState<JourneyTypeKey>('oneWay');
  const [vehicleType, setVehicleType] = useState<VehicleTypeKey>('sedan');
  const [locationMode, setLocationMode] = useState<LocationMode>('manual');

  // Duration
  const [hours, setHours] = useState('1');
  const [days, setDays] = useState('1');

  // Pickup
  const [pickupPincode, setPickupPincode] = useState('');
  const [pickupArea, setPickupArea] = useState('');
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Drop
  const [dropPincode, setDropPincode] = useState('');
  const [dropArea, setDropArea] = useState('');

  // Round trip
  const [returnToPickup, setReturnToPickup] = useState(false);

  // Contact
  const [phone, setPhone] = useState('');
  const [landmark, setLandmark] = useState('');

  // Start date/time
  const [startDateTime, setStartDateTime] = useState('');

  const [error, setError] = useState('');

  const showDropFields =
    journeyType === 'oneWay' || (journeyType === 'roundTrip' && !returnToPickup);

  const handleGpsCapture = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickupLat(pos.coords.latitude);
        setPickupLng(pos.coords.longitude);
        setGpsLoading(false);
        toast.success('Location captured');
      },
      (err) => {
        setError(`GPS error: ${err.message}`);
        setGpsLoading(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone.trim()) {
      setError('Phone number is required.');
      return;
    }

    // Build a unique trip ID using timestamp
    const tripId = `trip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const pickupLocation = {
      pincode: pickupPincode.trim(),
      area: pickupArea.trim(),
      latitude: pickupLat !== null ? pickupLat : undefined,
      longitude: pickupLng !== null ? pickupLng : undefined,
    };

    const dropoffLocation = showDropFields
      ? {
          pincode: dropPincode.trim(),
          area: dropArea.trim(),
          latitude: undefined,
          longitude: undefined,
        }
      : undefined;

    // Duration discriminated union matching backend Duration type
    const duration =
      tripType === 'local'
        ? ({ __kind__: 'hours', hours: BigInt(parseInt(hours) || 1) } as const)
        : ({ __kind__: 'days', days: BigInt(parseInt(days) || 1) } as const);

    // Use backend enums for TripType and JourneyType
    const tripTypeEnum: TripType = tripType === 'local' ? TripType.local : TripType.outstation;
    const journeyTypeEnum: JourneyType =
      journeyType === 'oneWay' ? JourneyType.oneWay : JourneyType.roundTrip;

    // VehicleType enum is not exported from backend; cast via any
    const vehicleTypeValue = vehicleType as any;

    const startTs = startDateTime
      ? BigInt(new Date(startDateTime).getTime() * 1_000_000)
      : undefined;

    const tripRequest: TripRequest = {
      tripId,
      tripType: tripTypeEnum,
      journeyType: journeyTypeEnum,
      vehicleType: vehicleTypeValue,
      duration,
      startDateTime: startTs,
      endDateTime: undefined,
      pickupLocation,
      dropoffLocation,
      phone: phone.trim(),
      landmark: landmark.trim() || undefined,
      customerId: undefined,
      driverId: undefined,
      // Fare fields — set to 0; fare is computed/stored server-side
      totalFare: BigInt(0),
      ratePerHour: BigInt(0),
      billableHours: BigInt(0),
    };

    try {
      await createTrip.mutateAsync(tripRequest);
      // Reset form on success
      setPickupPincode('');
      setPickupArea('');
      setDropPincode('');
      setDropArea('');
      setPhone('');
      setLandmark('');
      setStartDateTime('');
      setPickupLat(null);
      setPickupLng(null);
    } catch {
      // Toast and console.error are handled in useCreateTrip onError
      setError('Booking failed. Please try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book a Ride</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Trip Type */}
          <div className="space-y-2">
            <Label>Trip Type</Label>
            <div className="flex gap-2">
              {(['local', 'outstation'] as TripTypeKey[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTripType(t)}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    tripType === t
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {t === 'local' ? 'Local' : 'Outstation'}
                </button>
              ))}
            </div>
          </div>

          {/* Journey Type */}
          <div className="space-y-2">
            <Label>Journey Type</Label>
            <div className="flex gap-2">
              {(['oneWay', 'roundTrip'] as JourneyTypeKey[]).map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => setJourneyType(j)}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    journeyType === j
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {j === 'oneWay' ? 'One Way' : 'Round Trip'}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Type */}
          <div className="space-y-2">
            <Label>Vehicle Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['hatchback', 'sedan', 'suv', 'luxury'] as VehicleTypeKey[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVehicleType(v)}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium capitalize transition-colors ${
                    vehicleType === v
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {v.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>{tripType === 'local' ? 'Duration (hours)' : 'Duration (days)'}</Label>
            <Input
              type="number"
              min="1"
              value={tripType === 'local' ? hours : days}
              onChange={(e) =>
                tripType === 'local' ? setHours(e.target.value) : setDays(e.target.value)
              }
            />
          </div>

          {/* Location Mode */}
          <div className="space-y-2">
            <Label>Pickup Location Mode</Label>
            <div className="flex gap-2">
              {(['manual', 'gps'] as LocationMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setLocationMode(m)}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    locationMode === m
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {m === 'manual' ? (
                    <span className="flex items-center justify-center gap-1">
                      <MapPin className="h-4 w-4" /> Manual
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1">
                      <Navigation className="h-4 w-4" /> GPS
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Pickup Manual Fields */}
          {locationMode === 'manual' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="pickupArea">Pickup Area</Label>
                <Input
                  id="pickupArea"
                  value={pickupArea}
                  onChange={(e) => setPickupArea(e.target.value)}
                  placeholder="e.g. Koramangala"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupPincode">Pickup Pincode</Label>
                <Input
                  id="pickupPincode"
                  value={pickupPincode}
                  onChange={(e) => setPickupPincode(e.target.value)}
                  placeholder="e.g. 560034"
                />
              </div>
            </>
          )}

          {/* GPS Capture */}
          {locationMode === 'gps' && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleGpsCapture}
                disabled={gpsLoading}
                className="w-full"
              >
                {gpsLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Getting location…
                  </>
                ) : pickupLat !== null ? (
                  <>
                    <Navigation className="h-4 w-4 mr-2" />
                    Location captured ✓
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4 mr-2" />
                    Capture GPS Location
                  </>
                )}
              </Button>
              {pickupLat !== null && (
                <p className="text-xs text-muted-foreground text-center">
                  {pickupLat.toFixed(5)}, {pickupLng?.toFixed(5)}
                </p>
              )}
            </div>
          )}

          {/* Return to same pickup (round trip only) */}
          {journeyType === 'roundTrip' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="returnToPickup"
                checked={returnToPickup}
                onChange={(e) => setReturnToPickup(e.target.checked)}
                className="rounded border-border"
              />
              <Label htmlFor="returnToPickup" className="font-normal cursor-pointer">
                Return to same pickup location
              </Label>
            </div>
          )}

          {/* Drop Location */}
          {showDropFields && (
            <>
              <div className="space-y-2">
                <Label htmlFor="dropArea">Drop Area</Label>
                <Input
                  id="dropArea"
                  value={dropArea}
                  onChange={(e) => setDropArea(e.target.value)}
                  placeholder="e.g. Whitefield"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dropPincode">Drop Pincode</Label>
                <Input
                  id="dropPincode"
                  value={dropPincode}
                  onChange={(e) => setDropPincode(e.target.value)}
                  placeholder="e.g. 560066"
                />
              </div>
            </>
          )}

          {/* Start Date/Time */}
          <div className="space-y-2">
            <Label htmlFor="startDateTime">Start Date &amp; Time</Label>
            <Input
              id="startDateTime"
              type="datetime-local"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
            />
          </div>

          {/* Landmark */}
          <div className="space-y-2">
            <Label htmlFor="landmark">Landmark (optional)</Label>
            <Input
              id="landmark"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Near City Mall"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={createTrip.isPending}>
            {createTrip.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Booking…
              </>
            ) : (
              'Book Ride'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
