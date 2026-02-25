import { useGetAllTrips, useGetAllUsers } from '../hooks/useQueries';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { TripStatus } from '../backend';
import type { Location } from '../backend';

const statusColors: Record<TripStatus, string> = {
  requested: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  accepted: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  completed: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
  cancelled: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
};

const statusLabels: Record<TripStatus, string> = {
  requested: 'Pending',
  accepted: 'Accepted',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function formatLocation(location: Location | undefined): string {
  if (!location) return 'N/A';
  return `${location.area}, ${location.pincode}`;
}

export default function AdminTripsTab() {
  const { data: trips, isLoading: loadingTrips } = useGetAllTrips();
  const { data: users } = useGetAllUsers();
  const [searchTerm, setSearchTerm] = useState('');

  // Create a map of principal to user for quick lookup
  const userMap = useMemo(() => {
    const map = new Map<string, { email: string; fullName: string }>();
    users?.forEach((user) => {
      map.set(user.principalId.toString(), { email: user.email, fullName: user.fullName });
    });
    return map;
  }, [users]);

  const filteredTrips = trips?.filter(
    (trip) =>
      trip.pickupLocation.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.pickupLocation.pincode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.dropoffLocation && trip.dropoffLocation.area.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (trip.dropoffLocation && trip.dropoffLocation.pincode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      trip.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      statusLabels[trip.status].toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loadingTrips) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search by location or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <p className="text-sm text-muted-foreground">
          Total: {filteredTrips?.length || 0} trip{filteredTrips?.length !== 1 ? 's' : ''}
        </p>
      </div>

      <ScrollArea className="h-[500px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead>Dropoff</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrips && filteredTrips.length > 0 ? (
              filteredTrips.map((trip) => {
                const customer = userMap.get(trip.customerId.toString());
                const driver = trip.driverId ? userMap.get(trip.driverId.toString()) : null;

                return (
                  <TableRow key={trip.tripId}>
                    <TableCell className="font-medium">
                      {customer?.email || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {driver
                        ? driver.email
                        : <span className="text-muted-foreground text-xs">Not assigned</span>
                      }
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate">
                      {formatLocation(trip.pickupLocation)}
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate">
                      {formatLocation(trip.dropoffLocation)}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(Number(trip.createdTime) / 1000000).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[trip.status]}>
                        {statusLabels[trip.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No trips found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
