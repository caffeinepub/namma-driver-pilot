import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import type { UserProfile, VehicleExperience, TransmissionComfort } from '../backend';

interface EditDriverProfileFormProps {
  userProfile: UserProfile;
  onClose: () => void;
}

export default function EditDriverProfileForm({ userProfile, onClose }: EditDriverProfileFormProps) {
  const [servicePincode, setServicePincode] = useState(userProfile.servicePincode || '');
  const [serviceAreaName, setServiceAreaName] = useState(userProfile.serviceAreaName || '');
  const [vehicleExperience, setVehicleExperience] = useState<VehicleExperience[]>(
    userProfile.vehicleExperience || []
  );
  const [transmissionComfort, setTransmissionComfort] = useState<TransmissionComfort[]>(
    userProfile.transmissionComfort || []
  );
  const [languages, setLanguages] = useState(
    userProfile.languages ? userProfile.languages.join(', ') : ''
  );
  const [isAvailable, setIsAvailable] = useState(userProfile.isAvailable);

  const saveProfileMutation = useSaveCallerUserProfile();

  const handleVehicleExperienceChange = (value: VehicleExperience, checked: boolean) => {
    if (checked) {
      setVehicleExperience([...vehicleExperience, value]);
    } else {
      setVehicleExperience(vehicleExperience.filter(v => v !== value));
    }
  };

  const handleTransmissionComfortChange = (value: TransmissionComfort, checked: boolean) => {
    if (checked) {
      setTransmissionComfort([...transmissionComfort, value]);
    } else {
      setTransmissionComfort(transmissionComfort.filter(t => t !== value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!servicePincode.trim() || !serviceAreaName.trim()) {
      alert('Service Pincode and Service Area Name are required');
      return;
    }

    const languagesArray = languages
      .split(',')
      .map(lang => lang.trim())
      .filter(lang => lang.length > 0);

    const updatedProfile: UserProfile = {
      ...userProfile,
      servicePincode: servicePincode.trim(),
      serviceAreaName: serviceAreaName.trim(),
      vehicleExperience,
      transmissionComfort,
      languages: languagesArray.length > 0 ? languagesArray : undefined,
      isAvailable,
    };

    try {
      await saveProfileMutation.mutateAsync(updatedProfile);
      onClose();
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <div className="space-y-3">
        <Label>Vehicle Experience</Label>
        <div className="space-y-2">
          {(['hatchback', 'sedan', 'suv', 'luxury'] as VehicleExperience[]).map((vehicle) => (
            <div key={vehicle} className="flex items-center space-x-2">
              <Checkbox
                id={`vehicle-${vehicle}`}
                checked={vehicleExperience.includes(vehicle)}
                onCheckedChange={(checked) =>
                  handleVehicleExperienceChange(vehicle, checked as boolean)
                }
              />
              <Label
                htmlFor={`vehicle-${vehicle}`}
                className="text-sm font-normal cursor-pointer"
              >
                {vehicle === 'hatchback' && 'Hatchback'}
                {vehicle === 'sedan' && 'Sedan'}
                {vehicle === 'suv' && 'SUV'}
                {vehicle === 'luxury' && 'Luxury'}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Transmission Comfort</Label>
        <div className="space-y-2">
          {(['manual', 'automatic', 'ev'] as TransmissionComfort[]).map((transmission) => (
            <div key={transmission} className="flex items-center space-x-2">
              <Checkbox
                id={`transmission-${transmission}`}
                checked={transmissionComfort.includes(transmission)}
                onCheckedChange={(checked) =>
                  handleTransmissionComfortChange(transmission, checked as boolean)
                }
              />
              <Label
                htmlFor={`transmission-${transmission}`}
                className="text-sm font-normal cursor-pointer"
              >
                {transmission === 'manual' && 'Manual'}
                {transmission === 'automatic' && 'Automatic'}
                {transmission === 'ev' && 'EV'}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="languages">Languages (comma-separated, optional)</Label>
        <Input
          id="languages"
          value={languages}
          onChange={(e) => setLanguages(e.target.value)}
          placeholder="e.g., English, Hindi, Tamil"
        />
      </div>

      <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
        <div className="space-y-0.5">
          <Label htmlFor="isAvailable" className="text-base">
            Availability Status
          </Label>
          <p className="text-sm text-muted-foreground">
            Set yourself as available to accept trips
          </p>
        </div>
        <Switch
          id="isAvailable"
          checked={isAvailable}
          onCheckedChange={setIsAvailable}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={saveProfileMutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={saveProfileMutation.isPending}>
          {saveProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Profile
        </Button>
      </div>
    </form>
  );
}
