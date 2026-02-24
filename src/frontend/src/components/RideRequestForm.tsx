import { useState, useEffect } from 'react';
import { useCreateTrip } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { MapPin, Phone, Navigation } from 'lucide-react';
import { TripType, JourneyType, TransmissionComfort } from '../backend';

export default function RideRequestForm() {
  // Form state
  const [tripType, setTripType] = useState<'local' | 'outstation'>('local');
  const [journeyType, setJourneyType] = useState<'oneWay' | 'roundTrip'>('oneWay');
  const [vehicleType, setVehicleType] = useState<string>('');
  const [transmissionType, setTransmissionType] = useState<string>('');
  
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

  // Handle journey type selection with modal
  const handleJourneyTypeChange = (value: string) => {
    setJourneyType(value as 'oneWay' | 'roundTrip');
    
    if (value === 'oneWay') {
      setJourneyModalText('One Way: Pickup & Drop are at different locations in the city.');
    } else {
      setJourneyModalText('Round Trip: Pickup & Drop are the same location in the city (driver returns to pickup).');
    }
    
    setShowJourneyModal(true);
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
        toast.success('Location captured successfully!');
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationMode('manual');
        setGpsCoords(null);
        setGpsAddress('');
        toast.error('Location permission denied. Please enter pickup manually.');
      }
    );
  };

  // Determine if drop fields should be shown
  const showDropFields = tripType === 'outstation' && journeyType === 'oneWay';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!tripType || !journeyType || !vehicleType || !transmissionType) {
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

    if (showDropFields) {
      if (!dropPincode.trim() || !dropArea.trim()) {
        toast.error('Please enter drop pincode and area for outstation one-way trips');
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
      
      // VehicleType is a string literal type matching backend enum values
      const vehicleTypeValue = vehicleType as 'hatchback' | 'sedan' | 'suv' | 'luxury';

      // TransmissionComfort enum mapping
      const transmissionComfortEnum = transmissionType === 'manual' 
        ? TransmissionComfort.manual 
        : transmissionType === 'automatic' 
        ? TransmissionComfort.automatic 
        : TransmissionComfort.ev;

      const duration = tripType === 'local'
        ? { __kind__: 'hours' as const, hours: BigInt(durationHours === 'custom' ? customHours : durationHours) }
        : { __kind__: 'days' as const, days: BigInt(calculatedDays) };

      const pickupLocation = {
        pincode: pickupPincode || 'unknown',
        area: pickupArea || 'GPS Location',
        latitude: gpsCoords?.lat,
        longitude: gpsCoords?.lng,
      };

      const dropoffLocation = showDropFields
        ? {
            pincode: dropPincode,
            area: dropArea,
            latitude: undefined,
            longitude: undefined,
          }
        : null;

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
        transmissionType: transmissionComfortEnum,
      });

      toast.success('Trip requested successfully!');
      
      // Reset form
      setTripType('local');
      setJourneyType('oneWay');
      setVehicleType('');
      setTransmissionType('');
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
      setPhone('');
      setLandmark('');
      setLocationMode('manual');
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

        {/* Transmission Type */}
        <div className="space-y-3">
          <Label htmlFor="transmissionType" className="text-base font-semibold">Transmission Type *</Label>
          <Select value={transmissionType} onValueChange={setTransmissionType}>
            <SelectTrigger id="transmissionType">
              <SelectValue placeholder="Select transmission type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="automatic">Automatic</SelectItem>
              <SelectItem value="ev">EV</SelectItem>
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

        {/* Location Mode */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Location Mode *</Label>
          <RadioGroup value={locationMode} onValueChange={(value) => setLocationMode(value as 'manual' | 'gps')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="manual" id="manual" />
              <Label htmlFor="manual" className="font-normal cursor-pointer">Manual Entry</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="gps" id="gps" />
              <Label htmlFor="gps" className="font-normal cursor-pointer">Use GPS</Label>
            </div>
          </RadioGroup>
        </div>

        {/* GPS Location */}
        {locationMode === 'gps' && (
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleGetLocation}
              className="w-full"
            >
              <Navigation className="mr-2 h-4 w-4" />
              Get My Location
            </Button>
            {gpsAddress && (
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                📍 {gpsAddress}
              </p>
            )}
          </div>
        )}

        {/* Pickup Location - Manual Entry Only */}
        {locationMode === 'manual' && (
          <>
            <div className="space-y-3">
              <Label htmlFor="pickupPincode" className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Pickup Pincode *
              </Label>
              <Input
                id="pickupPincode"
                type="text"
                placeholder="e.g., 560001"
                value={pickupPincode}
                onChange={(e) => setPickupPincode(e.target.value)}
                maxLength={6}
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="pickupArea" className="text-base font-semibold">Pickup Area Name *</Label>
              <Input
                id="pickupArea"
                type="text"
                placeholder="e.g., Koramangala, Indiranagar"
                value={pickupArea}
                onChange={(e) => setPickupArea(e.target.value)}
                required
              />
            </div>
          </>
        )}

        {/* Drop Location - Only for Outstation One-Way */}
        {showDropFields && (
          <>
            <div className="space-y-3">
              <Label htmlFor="dropPincode" className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Drop Pincode *
              </Label>
              <Input
                id="dropPincode"
                type="text"
                placeholder="e.g., 560001"
                value={dropPincode}
                onChange={(e) => setDropPincode(e.target.value)}
                maxLength={6}
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="dropArea" className="text-base font-semibold">Drop Area Name *</Label>
              <Input
                id="dropArea"
                type="text"
                placeholder="e.g., Whitefield, Electronic City"
                value={dropArea}
                onChange={(e) => setDropArea(e.target.value)}
                required
              />
            </div>
          </>
        )}

        {/* Contact Information */}
        <div className="space-y-3">
          <Label htmlFor="phone" className="text-base font-semibold flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Phone Number *
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={10}
            required
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="landmark" className="text-base font-semibold">Landmark (Optional)</Label>
          <Input
            id="landmark"
            type="text"
            placeholder="e.g., Near Metro Station, Opposite Mall"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
          />
        </div>

        {/* Fare Calculation Message */}
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 Fare will be calculated based on trip type, vehicle, duration, and distance. A driver will contact you shortly after accepting your request.
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={createTrip.isPending}
        >
          {createTrip.isPending ? 'Requesting...' : 'Request Ride'}
        </Button>
      </form>

      {/* Journey Type Modal */}
      <Dialog open={showJourneyModal} onOpenChange={setShowJourneyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Journey Type Information</DialogTitle>
            <DialogDescription>
              {journeyModalText}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowJourneyModal(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
