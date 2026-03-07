import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import React, { useEffect } from "react";
import { Role } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetMyRole } from "../hooks/useQueries";

export default function LandingPage() {
  const navigate = useNavigate();
  const { identity, isInitializing } = useInternetIdentity();
  const { data: role, isLoading: roleLoading, isFetched } = useGetMyRole();

  useEffect(() => {
    if (isInitializing) return;

    if (!identity) {
      navigate({ to: "/login" });
      return;
    }

    // Authenticated — wait for role
    if (roleLoading || !isFetched) return;

    if (role === Role.admin) {
      navigate({ to: "/admin/dashboard" });
    } else if (role === Role.driver) {
      navigate({ to: "/driver/dashboard" });
    } else if (role === Role.customer) {
      navigate({ to: "/customer/dashboard" });
    } else {
      navigate({ to: "/select-role" });
    }
  }, [identity, isInitializing, role, roleLoading, isFetched, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
