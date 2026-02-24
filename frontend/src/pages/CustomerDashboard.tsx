import { useGetMyTrips } from '../hooks/useQueries';
import RideRequestForm from '../components/RideRequestForm';
import CustomerTripList from '../components/CustomerTripList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CustomerDashboard() {
  const { data: trips, isLoading } = useGetMyTrips();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Customer Dashboard</h1>
        <p className="text-muted-foreground">Request rides and track your trips</p>
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
