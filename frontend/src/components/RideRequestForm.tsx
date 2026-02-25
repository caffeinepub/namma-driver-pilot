import { useState, useEffect } from 'react';
import { useCreateTrip } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { MapPin, Phone, Navigation, AlertCircle } from 'lucide-react';
import { TripType, JourneyType } from '../backend';

export default function RideRequestForm() {
  // Form state
  const [tripType, setTripType] = useState<'local' | 'outstation'>('local');
  const [journeyType, setJourneyType] = useState<'oneWay' | 'roundTrip'>('oneWay');
  const [vehicleType, setVehicleType] = useState<string>('');

  // Duration state
  const [durationHours, setDurationHours] = useState<string>('2');
  const [customHours, setCustomHours] = useState<string>('');
  const [startDateTime, setStartDateTime] = useState<string>('');
  const [endDateTime, setEndDateTime] = useState<string>('');
  const [calculatedDays, setCalculatedDays] = useState<number>(0);

  // Location state
  const [locationMode, setLocationMode] = useState<'manual' | 'gps'>('manual');
  const [pickupPincode, setPickupPincode] = useState('');
  const [pickupArea, setPickupArea] = useState('');
  const [dropPincode, setDropPincode] = useState('');
  const [dropArea, setDropArea] = useState('');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAddress, setGpsAddress] = useState('');
  const [gpsError, setGpsError] = useState('');

  // Round trip: "Return to same pickup location" toggle (default ON)
  const [returnToPickup, setReturnToPickup] = useState(true);

  // Contact state
  const [phone, setPhone] = useState('');
  const [landmark, setLandmark] = useState('');

  // UI state
  const [showJourneyModal, setShowJourneyModal] = useState(false);
  const [journeyModalText, setJourneyModalText] = useState('');
  const [dateTimeError, setDateTimeError] = useState('');

  const createTrip = useCreateTrip();

  // Calculate duration in days for outstation trips
  useEffect(() => {
    if (tripType === 'outstation' && startDateTime && endDateTime) {
      const start = new Date(startDateTime).getTime();
      const end = new Date(endDateTime).getTime();

      if (end <= start) {
        setDateTimeError('End date & time must be after start date & time');
        setCalculatedDays(0);
      } else {
        setDateTimeError('');
        const diffMs = end - start;
        const diffHours = diffMs / (1000 * 60 * 60);
        const days = Math.ceil(diffHours / 24);
        setCalculatedDays(days);
      }
    } else {
      setDateTimeError('');
      setCalculatedDays(0);
    }
  }, [startDateTime, endDateTime, tripType]);

  // When round trip toggle is ON, auto-sync drop fields to pickup fields
  useEffect(() => {
    if (journeyType === 'roundTrip' && returnToPickup) {
      setDropPincode(pickupPincode);
      setDropArea(pickupArea);
    }
  }, [journeyType, returnToPickup, pickupPincode, pickupArea]);

  // Reset returnToPickup to true whenever journeyType switches to roundTrip
  useEffect(() => {
    if (journeyType === 'roundTrip') {
      setReturnToPickup(true);
    }
  }, [journeyType]);

  // Handle journey type selection with modal
  const handleJourneyTypeChange = (value: string) => {
    setJourneyType(value as 'oneWay' | 'roundTrip');

    if (value === 'oneWay') {
      setJourneyModalText('One Way: Pickup & Drop are at different locations.');
    } else {
      setJourneyModalText('Round Trip: Driver returns to the pickup location after the trip.');
    }

    setShowJourneyModal(true);
  };

  // Handle location mode change — clear GPS error when user manually switches
  const handleLocationModeChange = (value: string) => {
    setLocationMode(value as 'manual' | 'gps');
    setGpsError('');
  };

  // Handle GPS location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    toast.info('Requesting location permission...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGpsCoords({ lat: latitude, lng: longitude });
        setGpsAddress(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
        setGpsError('');
        toast.success('Location captured successfully!');
      },
      (error) => {
        // GPS failed for any reason (permission denied OR other error):
        // auto-switch back to manual so pickup fields become visible
        setLocationMode('manual');
        setGpsCoords(null);
        setGpsAddress('');
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError('Location permission denied. Please enter pickup manually.');
          toast.error('GPS permission denied. Please enter your pickup location manually.');
        } else {
          setGpsError('Unable to get location. Please enter pickup manually.');
          toast.error('Unable to get location. Please enter pickup manually.');
        }
      }
    );
  };

  // Only allow digits in pincode fields
  const handlePickupPincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setPickupPincode(value);
  };

  const handleDropPincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setDropPincode(value);
  };

  // ─── VISIBILITY FLAGS ────────────────────────────────────────────────────────
  //
  // A) Pickup manual fields:
  //    Visible ONLY when locationMode === 'manual'.
  //    NEVER depends on journeyType.
  const showPickupManualFields = locationMode === 'manual';

  // B) Drop fields:
  //    oneWay          → always show
  //    roundTrip + returnToPickup=true  → hide
  //    roundTrip + returnToPickup=false → show
  const showDropFields =
    journeyType === 'oneWay' ||
    (journeyType === 'roundTrip' && !returnToPickup);
  // ─────────────────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!tripType || !journeyType || !vehicleType) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Duration validation
    if (tripType === 'local') {
      const hours = durationHours === 'custom' ? parseInt(customHours) : parseInt(durationHours);
      if (isNaN(hours) || hours < 2) {
        toast.error('Duration must be at least 2 hours for local trips');
        return;
      }
    } else {
      if (!startDateTime || !endDateTime) {
        toast.error('Please select start and end date & time for outstation trips');
        return;
      }
      if (dateTimeError) {
        toast.error(dateTimeError);
        return;
      }
      if (calculatedDays < 1) {
        toast.error('Duration must be at least 1 day for outstation trips');
        return;
      }
    }

    // Location validation
    if (locationMode === 'manual') {
      if (!pickupPincode.trim() || !pickupArea.trim()) {
        toast.error('Please enter pickup pincode and area');
        return;
      }
      if (!/^\d{6}$/.test(pickupPincode)) {
        toast.error('Pickup pincode must be exactly 6 digits');
        return;
      }
    } else if (locationMode === 'gps') {
      if (!gpsCoords) {
        toast.error('Please capture your GPS location');
        return;
      }
    }

    // Drop location validation
    if (showDropFields) {
      if (!dropPincode.trim() || !dropArea.trim()) {
        toast.error('Please enter drop pincode and area');
        return;
      }
      if (!/^\d{6}$/.test(dropPincode)) {
        toast.error('Drop pincode must be exactly 6 digits');
        return;
      }
    }

    // Phone validation
    if (!phone.trim()) {
      toast.error('Please enter phone number');
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    try {
      // Prepare trip data
      const tripTypeEnum = tripType === 'local' ? TripType.local : TripType.outstation;
      const journeyTypeEnum = journeyType === 'oneWay' ? JourneyType.oneWay : JourneyType.roundTrip;

      const vehicleTypeValue = vehicleType as 'hatchback' | 'sedan' | 'suv' | 'luxury';

      const duration = tripType === 'local'
        ? { __kind__: 'hours' as const, hours: BigInt(durationHours === 'custom' ? customHours : durationHours) }
        : { __kind__: 'days' as const, days: BigInt(calculatedDays) };

      const pickupLocation = locationMode === 'manual'
        ? {
            pincode: pickupPincode,
            area: pickupArea,
            latitude: undefined,
            longitude: undefined,
          }
        : {
            pincode: 'gps',
            area: 'GPS Location',
            latitude: gpsCoords?.lat,
            longitude: gpsCoords?.lng,
          };

      // Determine dropoff location
      let dropoffLocation: { pincode: string; area: string; latitude?: number; longitude?: number } | null = null;
      if (journeyType === 'oneWay') {
        dropoffLocation = {
          pincode: dropPincode,
          area: dropArea,
          latitude: undefined,
          longitude: undefined,
        };
      } else if (journeyType === 'roundTrip') {
        if (returnToPickup) {
          // Auto-set drop = pickup
          dropoffLocation = {
            pincode: locationMode === 'manual' ? pickupPincode : 'gps',
            area: locationMode === 'manual' ? pickupArea : 'GPS Location',
            latitude: locationMode === 'gps' ? gpsCoords?.lat : undefined,
            longitude: locationMode === 'gps' ? gpsCoords?.lng : undefined,
          };
        } else {
          dropoffLocation = {
            pincode: dropPincode,
            area: dropArea,
            latitude: undefined,
            longitude: undefined,
          };
        }
      }

      const startDateTimeValue = tripType === 'outstation' && startDateTime
        ? BigInt(new Date(startDateTime).getTime())
        : null;

      const endDateTimeValue = tripType === 'outstation' && endDateTime
        ? BigInt(new Date(endDateTime).getTime())
        : null;

      await createTrip.mutateAsync({
        tripType: tripTypeEnum,
        journeyType: journeyTypeEnum,
        vehicleType: vehicleTypeValue,
        duration,
        startDateTime: startDateTimeValue,
        endDateTime: endDateTimeValue,
        pickupLocation,
        dropoffLocation,
        phone,
        landmark: landmark.trim() || null,
      });

      toast.success('Trip requested successfully!');

      // Reset form
      setTripType('local');
      setJourneyType('oneWay');
      setVehicleType('');
      setDurationHours('2');
      setCustomHours('');
      setStartDateTime('');
      setEndDateTime('');
      setPickupPincode('');
      setPickupArea('');
      setDropPincode('');
      setDropArea('');
      setGpsCoords(null);
      setGpsAddress('');
      setGpsError('');
      setPhone('');
      setLandmark('');
      setLocationMode('manual');
      setReturnToPickup(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to request trip');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trip Type */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Trip Type *</Label>
          <RadioGroup value={tripType} onValueChange={(value) => setTripType(value as 'local' | 'outstation')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="local" id="local" />
              <Label htmlFor="local" className="font-normal cursor-pointer">Local</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="outstation" id="outstation" />
              <Label htmlFor="outstation" className="font-normal cursor-pointer">Outstation</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Journey Type */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Journey Type *</Label>
          <RadioGroup value={journeyType} onValueChange={handleJourneyTypeChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="oneWay" id="oneWay" />
              <Label htmlFor="oneWay" className="font-normal cursor-pointer">One Way</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="roundTrip" id="roundTrip" />
              <Label htmlFor="roundTrip" className="font-normal cursor-pointer">Round Trip</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Vehicle Type */}
        <div className="space-y-3">
          <Label htmlFor="vehicleType" className="text-base font-semibold">Vehicle Type *</Label>
          <Select value={vehicleType} onValueChange={setVehicleType}>
            <SelectTrigger id="vehicleType">
              <SelectValue placeholder="Select vehicle type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hatchback">Hatchback</SelectItem>
              <SelectItem value="sedan">Sedan</SelectItem>
              <SelectItem value="suv">SUV</SelectItem>
              <SelectItem value="luxury">Luxury</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Hire Duration - Local */}
        {tripType === 'local' && (
          <div className="space-y-3">
            <Label htmlFor="duration" className="text-base font-semibold">Hire Duration (Hours) *</Label>
            <Select value={durationHours} onValueChange={setDurationHours}>
              <SelectTrigger id="duration">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((hour) => (
                  <SelectItem key={hour} value={hour.toString()}>
                    {hour} {hour === 1 ? 'hour' : 'hours'}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {durationHours === 'custom' && (
              <div className="mt-2">
                <Input
                  type="number"
                  min="2"
                  placeholder="Enter hours (minimum 2)"
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                  required
                />
              </div>
            )}
          </div>
        )}

        {/* Hire Duration - Outstation */}
        {tripType === 'outstation' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="startDateTime" className="text-base font-semibold">Start Date & Time *</Label>
              <Input
                id="startDateTime"
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="endDateTime" className="text-base font-semibold">End Date & Time *</Label>
              <Input
                id="endDateTime"
                type="datetime-local"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
                required
              />
              {dateTimeError && (
                <p className="text-sm text-destructive">{dateTimeError}</p>
              )}
              {!dateTimeError && calculatedDays > 0 && (
                <p className="text-sm text-muted-foreground">
                  Duration: {calculatedDays} {calculatedDays === 1 ? 'day' : 'days'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Pickup Location Mode */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Pickup Location Mode *</Label>
          <RadioGroup value={locationMode} onValueChange={handleLocationModeChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="manual" id="manual" />
              <Label htmlFor="manual" className="font-normal cursor-pointer">Manual Entry</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="gps" id="gps" />
              <Label htmlFor="gps" className="font-normal cursor-pointer">Use GPS</Label>
            </div>
          </RadioGroup>

          {/* GPS permission denied / error message */}
          {gpsError && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{gpsError}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* GPS Location button — shown ONLY when GPS mode is selected */}
        {locationMode === 'gps' && (
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleGetLocation}
              className="w-full"
            >
              <Navigation className="mr-2 h-4 w-4" />
              Capture GPS Location
            </Button>
            {gpsCoords && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md text-sm">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">{gpsAddress}</span>
              </div>
            )}
          </div>
        )}

        {/* ── PICKUP MANUAL FIELDS ──────────────────────────────────────────────
            Visible ONLY when locationMode === 'manual'.
            NEVER depends on journeyType.
        ──────────────────────────────────────────────────────────────────────── */}
        {showPickupManualFields && (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="pickupPincode" className="text-base font-semibold">
                Pickup Pincode *
              </Label>
              <Input
                id="pickupPincode"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit pincode"
                value={pickupPincode}
                onChange={handlePickupPincodeChange}
                required
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="pickupArea" className="text-base font-semibold">
                Pickup Area *
              </Label>
              <Input
                id="pickupArea"
                type="text"
                placeholder="Enter pickup area / locality"
                value={pickupArea}
                onChange={(e) => setPickupArea(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {/* Round Trip — "Return to same pickup location" checkbox */}
        {journeyType === 'roundTrip' && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="returnToPickup"
              checked={returnToPickup}
              onCheckedChange={(checked) => setReturnToPickup(checked === true)}
            />
            <Label htmlFor="returnToPickup" className="font-normal cursor-pointer">
              Return to same pickup location
            </Label>
          </div>
        )}

        {/* ── DROP FIELDS ───────────────────────────────────────────────────────
            oneWay                              → visible + required
            roundTrip + returnToPickup=true     → hidden
            roundTrip + returnToPickup=false    → visible + required
        ──────────────────────────────────────────────────────────────────────── */}
        {showDropFields && (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="dropPincode" className="text-base font-semibold">
                Drop Pincode *
              </Label>
              <Input
                id="dropPincode"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit pincode"
                value={dropPincode}
                onChange={handleDropPincodeChange}
                required
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="dropArea" className="text-base font-semibold">
                Drop Area *
              </Label>
              <Input
                id="dropArea"
                type="text"
                placeholder="Enter drop area / locality"
                value={dropArea}
                onChange={(e) => setDropArea(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {/* Phone */}
        <div className="space-y-3">
          <Label htmlFor="phone" className="text-base font-semibold">Phone Number *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              className="pl-9"
              required
            />
          </div>
        </div>

        {/* Landmark (optional) */}
        <div className="space-y-3">
          <Label htmlFor="landmark" className="text-base font-semibold">
            Landmark <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="landmark"
            type="text"
            placeholder="Nearby landmark for easy identification"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          disabled={createTrip.isPending}
        >
          {createTrip.isPending ? 'Requesting...' : 'Request Ride'}
        </Button>
      </form>

      {/* Journey Type Info Modal */}
      <Dialog open={showJourneyModal} onOpenChange={setShowJourneyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Journey Type Selected</DialogTitle>
            <DialogDescription>{journeyModalText}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowJourneyModal(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
