import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, MapPin, Car, Settings, Edit, Languages, Radio } from 'lucide-react';
import type { DriverProfile } from '../backend';
import type { UserProfile } from '../lib/types';
import { type NormalizedDriverProfile } from '../utils/normalizeProfile';

interface DriverProfileSectionProps {
  profile: NormalizedDriverProfile | null;
  driverProfile?: DriverProfile | null;
  userProfile?: UserProfile | null;
  onEditClick: () => void;
}

function getVehicleLabel(v: string): string {
  const map: Record<string, string> = {
    hatchback: 'Hatchback',
    sedan: 'Sedan',
    suv: 'SUV',
    luxury: 'Luxury',
  };
  return map[v] ?? v;
}

function getTransmissionLabel(t: string): string {
  const map: Record<string, string> = {
    manual: 'Manual',
    automatic: 'Automatic',
    ev: 'EV',
  };
  return map[t] ?? t;
}

export default function DriverProfileSection({
  profile,
  driverProfile,
  userProfile,
  onEditClick,
}: DriverProfileSectionProps) {
  // Prefer driverProfile for duty status and languages (most up-to-date)
  const isAvailable = driverProfile?.isAvailable ?? profile?.isAvailable ?? false;
  const languages: string[] = driverProfile?.languages ?? profile?.languages ?? [];
  const serviceAreaName =
    driverProfile?.serviceAreaName ||
    profile?.serviceAreaName ||
    userProfile?.serviceAreaName ||
    'Not set';
  const servicePincode =
    driverProfile?.servicePincode ||
    profile?.servicePincode ||
    userProfile?.servicePincode ||
    '—';

  const vehicleExperience: string[] = driverProfile
    ? (driverProfile.vehicleExperience as string[])
    : (profile?.vehicleExperience ?? []);

  const transmissionComfort: string[] = driverProfile
    ? (driverProfile.transmissionComfort as string[])
    : (profile?.transmissionComfort ?? []);

  const displayName = userProfile?.fullName || 'Driver';
  const displayEmail = userProfile?.email || '';

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">{displayName}</CardTitle>
            {displayEmail && (
              <p className="text-sm text-muted-foreground">{displayEmail}</p>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onEditClick} className="gap-1">
          <Edit className="w-3.5 h-3.5" />
          Edit Profile
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Duty Status */}
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
          {isAvailable ? (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
              On-Duty
            </Badge>
          ) : (
            <Badge variant="secondary">Off-Duty</Badge>
          )}
        </div>

        {/* Service Area */}
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Service Area:</span>
          <span className="text-sm">{serviceAreaName}</span>
          {servicePincode && servicePincode !== '—' && servicePincode !== '000000' && (
            <span className="text-xs text-muted-foreground">({servicePincode})</span>
          )}
        </div>

        {/* Vehicle Experience */}
        {vehicleExperience.length > 0 && (
          <div className="flex items-start gap-2">
            <Car className="w-4 h-4 text-muted-foreground mt-0.5" />
            <span className="text-sm font-medium text-muted-foreground">Vehicles:</span>
            <div className="flex flex-wrap gap-1">
              {vehicleExperience.map((v) => (
                <Badge key={v} variant="outline" className="text-xs">
                  {getVehicleLabel(v)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Transmission Comfort */}
        {transmissionComfort.length > 0 && (
          <div className="flex items-start gap-2">
            <Settings className="w-4 h-4 text-muted-foreground mt-0.5" />
            <span className="text-sm font-medium text-muted-foreground">Transmission:</span>
            <div className="flex flex-wrap gap-1">
              {transmissionComfort.map((t) => (
                <Badge key={t} variant="outline" className="text-xs">
                  {getTransmissionLabel(t)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <div className="flex items-start gap-2">
            <Languages className="w-4 h-4 text-muted-foreground mt-0.5" />
            <span className="text-sm font-medium text-muted-foreground">Languages:</span>
            <div className="flex flex-wrap gap-1">
              {languages.map((lang) => (
                <Badge key={lang} variant="secondary" className="text-xs">
                  {lang}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {vehicleExperience.length === 0 &&
          transmissionComfort.length === 0 &&
          languages.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              No profile details yet. Click "Edit Profile" to get started.
            </p>
          )}
      </CardContent>
    </Card>
  );
}
