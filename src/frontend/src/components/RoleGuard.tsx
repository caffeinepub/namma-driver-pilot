import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { Role } from "../backend";
import { useGetMyRole } from "../hooks/useQueries";
import NotAuthorizedPage from "../pages/NotAuthorizedPage";

interface RoleGuardProps {
  allowedRole: "admin" | "driver" | "customer";
  children: React.ReactNode;
}

export default function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const navigate = useNavigate();
  const { data: role, isLoading, isFetched } = useGetMyRole();

  React.useEffect(() => {
    if (!isFetched || isLoading) return;

    // Unassigned → go pick a role
    if (role === Role.unassigned || role === null || role === undefined) {
      navigate({ to: "/select-role" });
      return;
    }

    // Admin trying to access non-admin route
    if (role === Role.admin && allowedRole !== "admin") {
      toast.error("Admin only area");
      return;
    }
  }, [role, isLoading, isFetched, allowedRole, navigate]);

  if (isLoading || !isFetched) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Unassigned — redirect handled in effect, show nothing
  if (role === Role.unassigned || role === null || role === undefined) {
    return null;
  }

  // Admin accessing admin route — allow
  if (role === Role.admin && allowedRole === "admin") {
    return <>{children}</>;
  }

  // Admin accessing non-admin route — show not authorized
  if (role === Role.admin && allowedRole !== "admin") {
    return <NotAuthorizedPage />;
  }

  // Role matches — allow
  const roleKey =
    role === Role.customer
      ? "customer"
      : role === Role.driver
        ? "driver"
        : role;
  if (roleKey === allowedRole) {
    return <>{children}</>;
  }

  // Role mismatch
  return <NotAuthorizedPage />;
}
