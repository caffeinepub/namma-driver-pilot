import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import React from "react";
import { Role } from "../backend";
import { Button } from "../components/ui/button";
import { useGetMyRole } from "../hooks/useQueries";

export default function PostLoginLandingPage() {
  const navigate = useNavigate();
  const {
    data: role,
    isLoading,
    isFetching,
    isError,
    isFetched,
    refetch,
  } = useGetMyRole();
  const redirectedRef = React.useRef(false);

  React.useEffect(() => {
    // Wait until the query has fully settled (not loading, not fetching, and fetched)
    if (!isFetched || isLoading || isFetching) return;
    if (redirectedRef.current) return;

    redirectedRef.current = true;

    if (role === Role.admin) {
      navigate({ to: "/admin/dashboard" });
    } else if (role === Role.driver) {
      navigate({ to: "/driver/dashboard" });
    } else if (role === Role.customer) {
      navigate({ to: "/customer/dashboard" });
    } else {
      // unassigned or null
      navigate({ to: "/select-role" });
    }
  }, [role, isLoading, isFetching, isFetched, navigate]);

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Failed to load your role
          </h2>
          <p className="text-muted-foreground mb-6 text-sm">
            We couldn't determine your account type. Please try again.
          </p>
          <Button
            onClick={() => {
              redirectedRef.current = false;
              refetch();
            }}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">
          Setting up your account…
        </p>
      </div>
    </div>
  );
}
