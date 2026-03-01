import React, { useState } from 'react';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useGetDriverProfile } from '../hooks/useQueries';
import DriverProfileSection from '../components/DriverProfileSection';
import EditDriverProfileModal from '../components/EditDriverProfileModal';
import AvailableTripsSection from '../components/AvailableTripsSection';
import DriverTripList from '../components/DriverTripList';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { normalizeDriverProfile } from '../utils/normalizeProfile';
import type { DriverProfile } from '../backend';

export default function DriverDashboard() {
  const [editModalOpen, setEditModalOpen] = useState(false);

  const {
    data: userProfile,
    isLoading: profileLoading,
  } = useGetCallerUserProfile();

  const {
    data: driverProfile,
    isLoading: driverProfileLoading,
  } = useGetDriverProfile();

  const isLoading = profileLoading || driverProfileLoading;

  const normalizedProfile = React.useMemo(() => {
    if (driverProfile) {
      return normalizeDriverProfile(driverProfile as any);
    }
    if (userProfile) {
      return normalizeDriverProfile(userProfile as any);
    }
    return null;
  }, [driverProfile, userProfile]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Driver Profile Card */}
      <DriverProfileSection
        profile={normalizedProfile}
        driverProfile={driverProfile ?? null}
        userProfile={userProfile ?? null}
        onEditClick={() => setEditModalOpen(true)}
      />

      {/* Trips Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Trips</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-4">
          <Tabs defaultValue="available" className="w-full">
            <div className="px-6 pt-0 pb-4">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="available" className="flex-1 sm:flex-none">
                  Available Trips
                </TabsTrigger>
                <TabsTrigger value="my-trips" className="flex-1 sm:flex-none">
                  My Trips
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="available" className="px-6 mt-0">
              <AvailableTripsSection />
            </TabsContent>

            <TabsContent value="my-trips" className="px-6 mt-0">
              <DriverTripList />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Profile Modal */}
      <EditDriverProfileModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        profile={driverProfile ?? (userProfile as any) ?? null}
      />
    </div>
  );
}
