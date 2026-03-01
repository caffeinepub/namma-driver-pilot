import { useState } from 'react';
import type { UserProfile } from '../lib/types';
import { useSaveCallerUserProfile, useUpdateAvailability } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Loader2, Lock } from 'lucide-react';

interface EditDriverProfileFormProps {
  profile: UserProfile;
  onClose: () => void;
  hasAcceptedTrip?: boolean;
}

type VehicleKey = '#hatchback' | '#sedan' | '#suv' | '#luxury';
type TransmissionKey = '#manual' | '#automatic' | '#ev';

const VEHICLE_OPTIONS: { key: VehicleKey; label: string }[] = [
  { key: '#hatchback', label: 'Hatchback' },
  { key: '#sedan', label: 'Sedan' },
  { key: '#suv', label: 'SUV' },
  { key: '#luxury', label: 'Luxury' },
];

const TRANSMISSION_OPTIONS: { key: TransmissionKey; label: string }[] = [
  { key: '#manual', label: 'Manual' },
  { key: '#automatic', label: 'Automatic' },
  { key: '#ev', label: 'EV' },
];

const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];

export default function EditDriverProfileForm({
  profile,
  onClose,
  hasAcceptedTrip,
}: EditDriverProfileFormProps) {
  const saveProfile = useSaveCallerUserProfile();
  const updateAvailability = useUpdateAvailability();

  const [servicePincode, setServicePincode] = useState(profile.servicePincode);
  const [serviceAreaName, setServiceAreaName] = useState(profile.serviceAreaName);
  const [isAvailable, setIsAvailable] = useState(profile.isAvailable);

  const currentVehicles = new Set(
    profile.vehicleExperience.map((v) => Object.keys(v)[0] as VehicleKey)
  );
  const [selectedVehicles, setSelectedVehicles] = useState<Set<VehicleKey>>(currentVehicles);

  const currentTransmissions = new Set(
    profile.transmissionComfort.map((t) => Object.keys(t)[0] as TransmissionKey)
  );
  const [selectedTransmissions, setSelectedTransmissions] = useState<Set<TransmissionKey>>(currentTransmissions);

  const currentLanguages = new Set(
    profile.languages && profile.languages.length > 0 ? profile.languages[0] ?? [] : []
  );
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(currentLanguages);

  const [error, setError] = useState('');

  const toggleVehicle = (key: VehicleKey) => {
    setSelectedVehicles((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleTransmission = (key: TransmissionKey) => {
    setSelectedTransmissions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) => {
      const next = new Set(prev);
      if (next.has(lang)) next.delete(lang); else next.add(lang);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const vehicleExperience = Array.from(selectedVehicles).map((k) => ({ [k]: null } as any));
      const transmissionComfort = Array.from(selectedTransmissions).map((k) => ({ [k]: null } as any));
      const languages: [string[]] = [Array.from(selectedLanguages)];

      await saveProfile.mutateAsync({
        ...profile,
        servicePincode,
        serviceAreaName,
        vehicleExperience,
        transmissionComfort,
        languages,
      } as unknown as UserProfile);

      if (isAvailable !== profile.isAvailable && !hasAcceptedTrip) {
        await updateAvailability.mutateAsync(isAvailable);
      }

      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save. Please try again.');
    }
  };

  const isSaving = saveProfile.isPending || updateAvailability.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 mt-2">
      <div className="space-y-2">
        <Label htmlFor="serviceAreaName">Service Area Name</Label>
        <Input
          id="serviceAreaName"
          value={serviceAreaName}
          onChange={(e) => setServiceAreaName(e.target.value)}
          placeholder="e.g. Bangalore South"
          disabled={isSaving}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="servicePincode">Service Pincode</Label>
        <Input
          id="servicePincode"
          value={servicePincode}
          onChange={(e) => setServicePincode(e.target.value)}
          placeholder="e.g. 560001"
          disabled={isSaving}
        />
      </div>

      <div className="space-y-2">
        <Label>Vehicle Experience</Label>
        <div className="grid grid-cols-2 gap-2">
          {VEHICLE_OPTIONS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={`vehicle-${key}`}
                checked={selectedVehicles.has(key)}
                onCheckedChange={() => toggleVehicle(key)}
                disabled={isSaving}
              />
              <Label htmlFor={`vehicle-${key}`} className="font-normal cursor-pointer">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Transmission Comfort</Label>
        <div className="grid grid-cols-2 gap-2">
          {TRANSMISSION_OPTIONS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={`trans-${key}`}
                checked={selectedTransmissions.has(key)}
                onCheckedChange={() => toggleTransmission(key)}
                disabled={isSaving}
              />
              <Label htmlFor={`trans-${key}`} className="font-normal cursor-pointer">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Languages</Label>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGE_OPTIONS.map((lang) => (
            <div key={lang} className="flex items-center gap-2">
              <Checkbox
                id={`lang-${lang}`}
                checked={selectedLanguages.has(lang)}
                onCheckedChange={() => toggleLanguage(lang)}
                disabled={isSaving}
              />
              <Label htmlFor={`lang-${lang}`} className="font-normal cursor-pointer">
                {lang}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Duty Status</Label>
        <div className="flex items-center gap-3">
          <Switch
            checked={isAvailable}
            onCheckedChange={setIsAvailable}
            disabled={isSaving || hasAcceptedTrip}
          />
          <span className="text-sm font-medium">
            {isAvailable ? 'On-Duty' : 'Off-Duty'}
          </span>
          {hasAcceptedTrip && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Locked during active trip
            </span>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSaving} className="flex-1">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
