import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Edit } from 'lucide-react';
import type { UserProfile } from '../backend';

type VehicleExperience = 'hatchback' | 'sedan' | 'suv' | 'luxury';
type TransmissionComfort = 'manual' | 'automatic' | 'ev';

interface DriverProfileSectionProps {
  userProfile: UserProfile | null | undefined;
  isLoading: boolean;
  error: Error | null;
  onEditClick: () => void;
}

export default function DriverProfileSection({ userProfile, isLoading, error, onEditClick }: DriverProfileSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load profile: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!userProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No profile data available</p>
        </CardContent>
      </Card>
    );
  }

  const formatVehicleExperience = (experience: VehicleExperience[]): string => {
    if (!experience || experience.length === 0) return 'None';
    return experience.map(exp => {
      switch (exp) {
        case 'hatchback': return 'Hatchback';
        case 'sedan': return 'Sedan';
        case 'suv': return 'SUV';
        case 'luxury': return 'Luxury';
        default: return exp;
      }
    }).join(', ');
  };

  const formatTransmissionComfort = (comfort: TransmissionComfort[]): string => {
    if (!comfort || comfort.length === 0) return 'None';
    return comfort.map(trans => {
      switch (trans) {
        case 'manual': return 'Manual';
        case 'automatic': return 'Automatic';
        case 'ev': return 'EV';
        default: return trans;
      }
    }).join(', ');
  };

  const formatLanguages = (languages: string[] | undefined): string => {
    if (!languages || languages.length === 0) return 'None';
    return languages.join(', ');
  };

  const formatEarnings = (earnings: bigint): string => {
    return `₹${earnings.toString()}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>My Profile</CardTitle>
        <Button onClick={onEditClick} variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Service Pincode</p>
            <p className="text-base font-semibold">{userProfile.servicePincode || 'Not set'}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Service Area Name</p>
            <p className="text-base font-semibold">{userProfile.serviceAreaName || 'Not set'}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Vehicle Experience</p>
            <p className="text-base">{formatVehicleExperience(userProfile.vehicleExperience as VehicleExperience[])}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Transmission Comfort</p>
            <p className="text-base">{formatTransmissionComfort(userProfile.transmissionComfort as TransmissionComfort[])}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Availability Status</p>
            <div className="mt-1">
              {userProfile.isAvailable ? (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">Available</Badge>
              ) : (
                <Badge variant="secondary">Unavailable</Badge>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
            <p className="text-base font-semibold">{formatEarnings(userProfile.totalEarnings)}</p>
          </div>

          <div className="md:col-span-2">
            <p className="text-sm font-medium text-muted-foreground">Languages</p>
            <p className="text-base">{formatLanguages(userProfile.languages)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
