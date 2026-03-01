import type { UserProfile } from '../lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Car, DollarSign, Lock } from 'lucide-react';

interface DriverProfileSectionProps {
  profile: UserProfile;
  hasAcceptedTrip?: boolean;
}

function getVehicleLabels(profile: UserProfile): string[] {
  return profile.vehicleExperience.map((v) => {
    if ('#hatchback' in v) return 'Hatchback';
    if ('#sedan' in v) return 'Sedan';
    if ('#suv' in v) return 'SUV';
    if ('#luxury' in v) return 'Luxury';
    return 'Unknown';
  });
}

function getTransmissionLabels(profile: UserProfile): string[] {
  return profile.transmissionComfort.map((t) => {
    if ('#manual' in t) return 'Manual';
    if ('#automatic' in t) return 'Automatic';
    if ('#ev' in t) return 'EV';
    return 'Unknown';
  });
}

export default function DriverProfileSection({ profile, hasAcceptedTrip }: DriverProfileSectionProps) {
  const vehicleLabels = getVehicleLabels(profile);
  const transmissionLabels = getTransmissionLabels(profile);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Driver Profile</span>
          <div className="flex items-center gap-2">
            {hasAcceptedTrip && (
              <Badge variant="outline" className="text-xs gap-1">
                <Lock className="h-3 w-3" />
                Locked
              </Badge>
            )}
            <Badge variant={profile.isAvailable ? 'default' : 'secondary'}>
              {profile.isAvailable ? 'On-Duty' : 'Off-Duty'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Service Area
            </p>
            <p className="font-medium">
              {profile.serviceAreaName || '—'}
              {profile.servicePincode ? ` (${profile.servicePincode})` : ''}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Total Earnings
            </p>
            <p className="font-medium">₹{Number(profile.totalEarnings)}</p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Car className="h-3 w-3" /> Vehicle Experience
          </p>
          <div className="flex flex-wrap gap-2">
            {vehicleLabels.length > 0
              ? vehicleLabels.map((v) => <Badge key={v} variant="outline">{v}</Badge>)
              : <span className="text-sm text-muted-foreground">None specified</span>}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Transmission</p>
          <div className="flex flex-wrap gap-2">
            {transmissionLabels.length > 0
              ? transmissionLabels.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)
              : <span className="text-sm text-muted-foreground">None specified</span>}
          </div>
        </div>

        {hasAcceptedTrip && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 border rounded-md px-3 py-2 bg-muted/50">
            <Lock className="h-3 w-3 shrink-0" />
            Duty status is locked while you have an active trip.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
