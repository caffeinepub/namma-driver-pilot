import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute is a lightweight guard used inside individual route components.
 * It immediately redirects to /login if the user is not authenticated.
 * AuthGate handles the initial loading delay; ProtectedRoute is the final check.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const isAuthenticated = !!identity;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
