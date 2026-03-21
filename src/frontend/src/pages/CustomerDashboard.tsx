import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { Edit, User } from "lucide-react";
import { useState } from "react";
import CustomerTripList from "../components/CustomerTripList";
import DataLoadErrorBanner from "../components/DataLoadErrorBanner";
import RideRequestForm from "../components/RideRequestForm";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCustomerTrips } from "../hooks/useQueries";
import type { NormalizedTrip } from "../utils/normalizeTrip";

export default function CustomerDashboard() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const principal = identity?.getPrincipal().toString();

  const {
    data: fetchedTrips,
    isLoading,
    isError,
  } = useGetCustomerTrips(principal);

  const [optimisticTrips, setOptimisticTrips] = useState<NormalizedTrip[]>([]);

  const handleTripCreated = (newTrip: NormalizedTrip) => {
    setOptimisticTrips((prev) => {
      if (prev.some((t) => t.tripId === newTrip.tripId)) return prev;
      return [newTrip, ...prev];
    });
  };

  const fetchedIds = new Set((fetchedTrips ?? []).map((t) => t.tripId));
  const dedupedOptimistic = optimisticTrips.filter(
    (t) => !fetchedIds.has(t.tripId),
  );
  const displayTrips = [...dedupedOptimistic, ...(fetchedTrips ?? [])];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {isError && <DataLoadErrorBanner />}

      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold mb-1">Customer Dashboard</h1>
            <p className="text-muted-foreground">
              Request rides and track your trips
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize text-sm px-3 py-1">
              Role: Customer
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/customer/onboarding" })}
              className="gap-1.5"
              data-ocid="customer-dashboard.edit_profile.button"
            >
              <Edit className="w-3.5 h-3.5" />
              View / Edit Profile
            </Button>
          </div>
        </div>

        {principal && (
          <div className="mt-4 bg-muted/50 border border-border rounded-lg p-4 flex items-start gap-3">
            <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">
                Principal ID
              </p>
              <p className="text-xs font-mono break-all text-foreground">
                {principal}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Request a Ride</CardTitle>
            <CardDescription>
              Enter your pickup and dropoff locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RideRequestForm onTripCreated={handleTripCreated} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Trips</CardTitle>
            <CardDescription>
              {isLoading
                ? "Loading..."
                : `${displayTrips.length} trip${displayTrips.length !== 1 ? "s" : ""}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerTripList trips={displayTrips} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
