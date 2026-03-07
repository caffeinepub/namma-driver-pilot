import { useNavigate } from "@tanstack/react-router";
import { Car, Loader2, User } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { Role } from "../backend";
import {
  useGetMyRole,
  useSetMyRoleCustomer,
  useSetMyRoleDriver,
} from "../hooks/useQueries";

/**
 * Legacy role selection page — redirects to /select-role.
 * Kept as a module to avoid import errors from App.tsx.
 */
export default function RoleSelectionPage() {
  const navigate = useNavigate();
  const { data: currentRole, isLoading: roleLoading } = useGetMyRole();
  const setCustomer = useSetMyRoleCustomer();
  const setDriver = useSetMyRoleDriver();

  React.useEffect(() => {
    if (roleLoading) return;
    if (currentRole === Role.admin) {
      navigate({ to: "/admin/dashboard" });
    } else if (currentRole === Role.driver) {
      navigate({ to: "/driver/dashboard" });
    } else if (currentRole === Role.customer) {
      navigate({ to: "/customer/dashboard" });
    }
  }, [currentRole, roleLoading, navigate]);

  const handleSelectCustomer = async () => {
    try {
      await setCustomer.mutateAsync();
      navigate({ to: "/customer/dashboard" });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to set role. Please try again.");
    }
  };

  const handleSelectDriver = async () => {
    try {
      await setDriver.mutateAsync();
      navigate({ to: "/driver/dashboard" });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to set role. Please try again.");
    }
  };

  const isLoading = setCustomer.isPending || setDriver.isPending;

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Car className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome!</h1>
          <p className="text-muted-foreground text-base">
            How would you like to use Namma Driver Pilot?
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button
            type="button"
            onClick={handleSelectCustomer}
            disabled={isLoading}
            className="group relative flex items-center gap-5 p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all duration-200 text-left disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              {setCustomer.isPending ? (
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              ) : (
                <User className="h-7 w-7 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-lg text-foreground">
                Continue as Customer
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">
                Book rides and manage your trips
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleSelectDriver}
            disabled={isLoading}
            className="group relative flex items-center gap-5 p-6 rounded-2xl border-2 border-border bg-card hover:border-secondary hover:bg-secondary/5 transition-all duration-200 text-left disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
              {setDriver.isPending ? (
                <Loader2 className="h-7 w-7 animate-spin text-secondary" />
              ) : (
                <Car className="h-7 w-7 text-secondary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-lg text-foreground">
                Continue as Driver
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">
                Accept trips and earn money
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
