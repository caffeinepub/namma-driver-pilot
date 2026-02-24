import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Loader2, Lock } from 'lucide-react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import type { UserProfile } from '../backend';

type VehicleExperience = 'hatchback' | 'sedan' | 'suv' | 'luxury';
type TransmissionComfort = 'manual' | 'automatic' | 'ev';

const VEHICLE_OPTIONS: { value: VehicleExperience; label: string }[] = [
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'luxury', label: 'Luxury' },
];

const TRANSMISSION_OPTIONS: { value: TransmissionComfort; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automatic' },
  { value: 'ev', label: 'EV' },
];

const LANGUAGE_OPTIONS = ['Kannada', 'Tamil', 'Telugu', 'Malayalam', 'Hindi', 'English'];

interface EditDriverProfileFormProps {
  userProfile: UserProfile;
  onClose: () => void;
  /** True when the driver has at least one trip with status "accepted" */
  hasAcceptedTrip: boolean;
}

export default function EditDriverProfileForm({
  userProfile,
  onClose,
  hasAcceptedTrip,
}: EditDriverProfileFormProps) {
  const [servicePincode, setServicePincode] = useState(userProfile.servicePincode || '');
  const [serviceAreaName, setServiceAreaName] = useState(userProfile.serviceAreaName || '');
  const [vehicleExperience, setVehicleExperience] = useState<VehicleExperience[]>(
    (userProfile.vehicleExperience || []) as VehicleExperience[]
  );
  const [transmissionComfort, setTransmissionComfort] = useState<TransmissionComfort[]>(
    (userProfile.transmissionComfort || []) as TransmissionComfort[]
  );
  // When locked, always treat availability as true; otherwise use saved value
  const [isAvailable, setIsAvailable] = useState(userProfile.isAvailable);

  // Parse existing languages into known options + other
  const existingLanguages = userProfile.languages || [];
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    existingLanguages.filter(lang => LANGUAGE_OPTIONS.includes(lang))
  );
  const existingOther = existingLanguages.filter(lang => !LANGUAGE_OPTIONS.includes(lang)).join(', ');
  const [otherLanguage, setOtherLanguage] = useState(existingOther);

  const saveProfileMutation = useSaveCallerUserProfile();

  const handleVehicleExperienceChange = (value: VehicleExperience, checked: boolean) => {
    setVehicleExperience(prev =>
      checked ? [...prev, value] : prev.filter(v => v !== value)
    );
  };

  const handleTransmissionComfortChange = (value: TransmissionComfort, checked: boolean) => {
    setTransmissionComfort(prev =>
      checked ? [...prev, value] : prev.filter(t => t !== value)
    );
  };

  const handleLanguageChange = (lang: string, checked: boolean) => {
    setSelectedLanguages(prev =>
      checked ? [...prev, lang] : prev.filter(l => l !== lang)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!servicePincode.trim() || !serviceAreaName.trim()) {
      alert('Service Pincode and Service Area Name are required');
      return;
    }

    // Combine selected checkboxes + optional other text
    const otherLangs = otherLanguage
      .split(',')
      .map(l => l.trim())
      .filter(l => l.length > 0);
    const allLanguages = [...selectedLanguages, ...otherLangs];

    // When locked, always submit true for availability — never allow false while accepted trip exists
    const effectiveAvailability = hasAcceptedTrip ? true : isAvailable;

    const updatedProfile: UserProfile = {
      ...userProfile,
      servicePincode: servicePincode.trim(),
      serviceAreaName: serviceAreaName.trim(),
      vehicleExperience: vehicleExperience as any,
      transmissionComfort: transmissionComfort as any,
      languages: allLanguages.length > 0 ? allLanguages : undefined,
      isAvailable: effectiveAvailability,
    };

    try {
      await saveProfileMutation.mutateAsync(updatedProfile);
      onClose();
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  // The effective displayed value for the toggle
  const effectiveIsAvailable = hasAcceptedTrip ? true : isAvailable;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Service Pincode */}
      <div className="space-y-2">
        <Label htmlFor="servicePincode">
          Service Pincode <span className="text-destructive">*</span>
        </Label>
        <Input
          id="servicePincode"
          value={servicePincode}
          onChange={(e) => setServicePincode(e.target.value)}
          placeholder="Enter service pincode"
          required
        />
      </div>

      {/* Service Area Name */}
      <div className="space-y-2">
        <Label htmlFor="serviceAreaName">
          Service Area Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="serviceAreaName"
          value={serviceAreaName}
          onChange={(e) => setServiceAreaName(e.target.value)}
          placeholder="Enter service area name"
          required
        />
      </div>

      {/* Vehicle Experience */}
      <div className="space-y-3">
        <Label>Vehicle Experience</Label>
        <div className="grid grid-cols-2 gap-2">
          {VEHICLE_OPTIONS.map(({ value, label }) => (
            <div key={value} className="flex items-center space-x-2">
              <Checkbox
                id={`vehicle-${value}`}
                checked={vehicleExperience.includes(value)}
                onCheckedChange={(checked) =>
                  handleVehicleExperienceChange(value, checked as boolean)
                }
              />
              <Label
                htmlFor={`vehicle-${value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Transmission Comfort */}
      <div className="space-y-3">
        <Label>Transmission Comfort</Label>
        <div className="grid grid-cols-2 gap-2">
          {TRANSMISSION_OPTIONS.map(({ value, label }) => (
            <div key={value} className="flex items-center space-x-2">
              <Checkbox
                id={`transmission-${value}`}
                checked={transmissionComfort.includes(value)}
                onCheckedChange={(checked) =>
                  handleTransmissionComfortChange(value, checked as boolean)
                }
              />
              <Label
                htmlFor={`transmission-${value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div className="space-y-3">
        <Label>Languages</Label>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGE_OPTIONS.map((lang) => (
            <div key={lang} className="flex items-center space-x-2">
              <Checkbox
                id={`lang-${lang}`}
                checked={selectedLanguages.includes(lang)}
                onCheckedChange={(checked) =>
                  handleLanguageChange(lang, checked as boolean)
                }
              />
              <Label
                htmlFor={`lang-${lang}`}
                className="text-sm font-normal cursor-pointer"
              >
                {lang}
              </Label>
            </div>
          ))}
        </div>
        {/* Optional Other field */}
        <div className="space-y-1 pt-1">
          <Label htmlFor="otherLanguage" className="text-sm text-muted-foreground">
            Other (optional, comma-separated)
          </Label>
          <Input
            id="otherLanguage"
            value={otherLanguage}
            onChange={(e) => setOtherLanguage(e.target.value)}
            placeholder="e.g., Tulu, Konkani"
          />
        </div>
      </div>

      {/* Availability Toggle */}
      <div
        className={`flex items-center justify-between space-x-2 p-4 border rounded-lg transition-colors ${
          hasAcceptedTrip ? 'opacity-60 bg-muted/40 cursor-not-allowed' : ''
        }`}
      >
        <div className="space-y-0.5">
          <Label
            htmlFor="isAvailable"
            className={`text-base flex items-center gap-1.5 ${hasAcceptedTrip ? 'cursor-not-allowed' : ''}`}
          >
            Availability Status
            {hasAcceptedTrip && <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />}
          </Label>
          {hasAcceptedTrip ? (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Availability is locked while you have an accepted trip.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Set yourself as available to accept trips
            </p>
          )}
        </div>
        <Switch
          id="isAvailable"
          checked={effectiveIsAvailable}
          onCheckedChange={(val) => {
            if (!hasAcceptedTrip) setIsAvailable(val);
          }}
          disabled={hasAcceptedTrip}
          aria-disabled={hasAcceptedTrip}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={saveProfileMutation.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saveProfileMutation.isPending}>
          {saveProfileMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Profile
        </Button>
      </div>
    </form>
  );
}
