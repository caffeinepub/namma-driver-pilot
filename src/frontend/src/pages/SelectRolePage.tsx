import { useNavigate } from "@tanstack/react-router";
import { Car, Loader2, User } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { Role } from "../backend";
import {
  useGetCallerUserProfile,
  useGetDriverProfile,
  useGetMyRole,
  useSetMyRoleCustomer,
  useSetMyRoleDriver,
} from "../hooks/useQueries";

export default function SelectRolePage() {
  const navigate = useNavigate();
  const {
    data: currentRole,
    isLoading: roleLoading,
    isFetched: roleFetched,
  } = useGetMyRole();
  const { data: userProfile, isFetched: profileFetched } =
    useGetCallerUserProfile();
  const { data: driverProfile, isFetched: driverProfileFetched } =
    useGetDriverProfile();
  const redirectedRef = React.useRef(false);

  const setCustomer = useSetMyRoleCustomer();
  const setDriver = useSetMyRoleDriver();

  // If user already has a role, redirect them — but only after role is fully fetched
  React.useEffect(() => {
    if (roleLoading || !roleFetched) return;
    if (redirectedRef.current) return;

    if (currentRole === Role.admin) {
      redirectedRef.current = true;
      navigate({ to: "/admin/dashboard" });
    } else if (currentRole === Role.driver) {
      redirectedRef.current = true;
      // If driver has a profile, go to dashboard; else go to onboarding
      if (driverProfileFetched && driverProfile) {
        navigate({ to: "/driver/dashboard" });
      } else if (driverProfileFetched) {
        navigate({ to: "/driver/onboarding" });
      }
    } else if (currentRole === Role.customer) {
      redirectedRef.current = true;
      // If customer has a profile, go to dashboard; else go to onboarding
      if (profileFetched && userProfile) {
        navigate({ to: "/customer/dashboard" });
      } else if (profileFetched) {
        navigate({ to: "/customer/onboarding" });
      }
    }
    // Role.unassigned or null => stay on this page
  }, [
    currentRole,
    roleLoading,
    roleFetched,
    userProfile,
    profileFetched,
    driverProfile,
    driverProfileFetched,
    navigate,
  ]);

  const handleSelectCustomer = async () => {
    try {
      await setCustomer.mutateAsync();
      redirectedRef.current = true;
      // New customer — go to onboarding
      navigate({ to: "/customer/onboarding" });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to set role. Please try again.");
    }
  };

  const handleSelectDriver = async () => {
    try {
      await setDriver.mutateAsync();
      redirectedRef.current = true;
      // New driver — go to onboarding
      navigate({ to: "/driver/onboarding" });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to set role. Please try again.");
    }
  };

  const isLoading = setCustomer.isPending || setDriver.isPending;

  if (roleLoading || !roleFetched) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🚖</div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome to Namma Driver Pilot
          </h1>
          <p className="text-muted-foreground text-base">
            A professional driver, for your own vehicle.
          </p>
          <div className="mt-3 inline-block bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5">
            <span className="text-xs font-medium text-amber-700">
              🚨 Not a taxi — we drive your car
            </span>
          </div>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 gap-4">
          {/* Customer */}
          <button
            type="button"
            onClick={handleSelectCustomer}
            disabled={isLoading}
            className="group relative flex items-center gap-5 p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all duration-200 text-left disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            data-ocid="role-selection.customer.button"
          >
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              {setCustomer.isPending ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <User className="h-8 w-8 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xl text-foreground">
                I'm a Customer
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                I want to hire a driver for my vehicle
              </div>
            </div>
            <div className="text-2xl">👋</div>
          </button>

          {/* Driver */}
          <button
            type="button"
            onClick={handleSelectDriver}
            disabled={isLoading}
            className="group relative flex items-center gap-5 p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all duration-200 text-left disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            data-ocid="role-selection.driver.button"
          >
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              {setDriver.isPending ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <Car className="h-8 w-8 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xl text-foreground">
                I'm a Driver
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                I want to earn by driving customers' vehicles
              </div>
            </div>
            <div className="text-2xl">🚗</div>
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          You can only set your role once. Choose carefully.
        </p>
      </div>
    </div>
  );
}
