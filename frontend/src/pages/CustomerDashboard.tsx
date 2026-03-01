import { useGetMyTrips } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import RideRequestForm from '../components/RideRequestForm';
import CustomerTripList from '../components/CustomerTripList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DataLoadErrorBanner from '../components/DataLoadErrorBanner';
import { User, PlusCircle } from 'lucide-react';

export default function CustomerDashboard() {
  const { data: trips, isLoading, isError } = useGetMyTrips();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Data load error banner */}
      {isError && <DataLoadErrorBanner />}

      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold mb-1">Customer Dashboard</h1>
            <p className="text-muted-foreground">Request rides and track your trips</p>
          </div>
          <Badge variant="secondary" className="capitalize text-sm px-3 py-1">
            Role: Customer
          </Badge>
        </div>

        {/* Principal & Role info card */}
        {principal && (
          <div className="mt-4 bg-muted/50 border border-border rounded-lg p-4 flex items-start gap-3">
            <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Principal ID</p>
              <p className="text-xs font-mono break-all text-foreground">{principal}</p>
            </div>
          </div>
        )}

        {/* Create Booking placeholder button */}
        <div className="mt-4">
          <Button disabled className="gap-2" title="Booking functionality coming soon">
            <PlusCircle className="h-4 w-4" />
            Create Booking
          </Button>
          <p className="text-xs text-muted-foreground mt-1">Booking functionality coming soon</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Request Ride Form */}
        <Card>
          <CardHeader>
            <CardTitle>Request a Ride</CardTitle>
            <CardDescription>Enter your pickup and dropoff locations</CardDescription>
          </CardHeader>
          <CardContent>
            <RideRequestForm />
          </CardContent>
        </Card>

        {/* My Trips */}
        <Card>
          <CardHeader>
            <CardTitle>My Trips</CardTitle>
            <CardDescription>
              {isLoading ? 'Loading...' : `${trips?.length || 0} trip${trips?.length !== 1 ? 's' : ''}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerTripList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
