import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "@tanstack/react-router";
import { Edit, User } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import type { DriverProfile } from "../backend";
import AvailableTripsSection from "../components/AvailableTripsSection";
import DriverTripList from "../components/DriverTripList";
import {
  useGetCallerUserProfile,
  useGetDriverProfile,
  useUpsertDriverProfile,
} from "../hooks/useQueries";
import { normalizeDriverProfile } from "../utils/normalizeProfile";

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [togglingDuty, setTogglingDuty] = useState(false);

  const { data: userProfile, isLoading: profileLoading } =
    useGetCallerUserProfile();

  const { data: driverProfile, isLoading: driverProfileLoading } =
    useGetDriverProfile();

  const upsertDriver = useUpsertDriverProfile();

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

  const isOnDuty =
    driverProfile?.isAvailable ?? normalizedProfile?.isAvailable ?? false;

  const handleDutyToggle = async (checked: boolean) => {
    if (!driverProfile && !normalizedProfile) {
      toast.error("Please complete your profile first.");
      return;
    }
    setTogglingDuty(true);
    try {
      const current = driverProfile as DriverProfile | null;
      const updated: DriverProfile = {
        serviceAreaName:
          current?.serviceAreaName ?? normalizedProfile?.serviceAreaName ?? "",
        servicePincode:
          current?.servicePincode ?? normalizedProfile?.servicePincode ?? "",
        vehicleExperience:
          current?.vehicleExperience ??
          (normalizedProfile?.vehicleExperience as any) ??
          [],
        transmissionComfort:
          current?.transmissionComfort ??
          (normalizedProfile?.transmissionComfort as any) ??
          [],
        languages: current?.languages ?? normalizedProfile?.languages ?? [],
        isAvailable: checked,
        updatedTime: BigInt(Date.now()),
        vehicleTypes: (current?.vehicleTypes as string[]) ?? [],
        transmissionTypes: (current?.transmissionTypes as string[]) ?? [],
        luxuryVehicleDetails: (current?.luxuryVehicleDetails as string) ?? "",
        aadharNumber: (current?.aadharNumber as string) ?? "",
        aadharFrontBase64: (current?.aadharFrontBase64 as string) ?? "",
        aadharBackBase64: (current?.aadharBackBase64 as string) ?? "",
        dlNumber: (current?.dlNumber as string) ?? "",
        dlPhotoBase64: (current?.dlPhotoBase64 as string) ?? "",
        selfieBase64: (current?.selfieBase64 as string) ?? "",
        fullName: (current?.fullName as string) ?? "",
        mobile: (current?.mobile as string) ?? "",
        bankName: (current?.bankName as string) ?? "",
        bankAccount: (current?.bankAccount as string) ?? "",
        bankIFSC: (current?.bankIFSC as string) ?? "",
        bankUPI: (current?.bankUPI as string) ?? "",
      };
      await upsertDriver.mutateAsync(updated);
      toast.success(checked ? "You are now On-Duty" : "You are now Off-Duty");
    } catch (_err: any) {
      toast.error("Failed to update duty status");
    } finally {
      setTogglingDuty(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const displayName = userProfile?.fullName || "Driver";
  const serviceArea =
    driverProfile?.serviceAreaName ||
    normalizedProfile?.serviceAreaName ||
    "Not set";
  const servicePincode =
    driverProfile?.servicePincode || normalizedProfile?.servicePincode || "—";

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header Card with On-Duty Toggle */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Driver Info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {displayName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {serviceArea}
                  {servicePincode && servicePincode !== "—"
                    ? ` · ${servicePincode}`
                    : ""}
                </p>
              </div>
            </div>

            {/* On-Duty Toggle (DriveU style) */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold leading-tight">
                  {isOnDuty ? (
                    <span className="text-green-600">On-Duty</span>
                  ) : (
                    <span className="text-muted-foreground">Off-Duty</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isOnDuty ? "Visible to customers" : "Not accepting trips"}
                </p>
              </div>
              <Switch
                checked={isOnDuty}
                onCheckedChange={handleDutyToggle}
                disabled={togglingDuty}
                className="data-[state=checked]:bg-green-500"
                data-ocid="driver-dashboard.duty.toggle"
              />
            </div>
          </div>

          {/* Status Badge + Edit Profile */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              {isOnDuty ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  ● On-Duty
                </Badge>
              ) : (
                <Badge variant="secondary">● Off-Duty</Badge>
              )}
              {serviceArea !== "Not set" && (
                <Badge variant="outline" className="text-xs">
                  {serviceArea}
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/driver/onboarding" })}
              className="gap-1.5 text-sm"
              data-ocid="driver-dashboard.edit_profile.button"
            >
              <Edit className="w-3.5 h-3.5" />
              View / Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trips Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Trips</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-4">
          <Tabs defaultValue="available" className="w-full">
            <div className="px-6 pt-0 pb-4">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger
                  value="available"
                  className="flex-1 sm:flex-none"
                  data-ocid="driver-dashboard.available.tab"
                >
                  Available Trips
                </TabsTrigger>
                <TabsTrigger
                  value="my-trips"
                  className="flex-1 sm:flex-none"
                  data-ocid="driver-dashboard.my_trips.tab"
                >
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
    </div>
  );
}
