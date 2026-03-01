import { useState } from 'react';
import { useGetAllTrips } from '../hooks/useQueries';
import type { Trip } from '../lib/types';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search } from 'lucide-react';

function getStatusLabel(trip: Trip): string {
  const s = trip.status;
  if ('#requested' in s) return 'Requested';
  if ('#accepted' in s) return 'Accepted';
  if ('#completed' in s) return 'Completed';
  if ('#cancelled' in s) return 'Cancelled';
  return 'Unknown';
}

function getStatusVariant(trip: Trip): 'default' | 'secondary' | 'outline' | 'destructive' {
  const s = trip.status;
  if ('#completed' in s) return 'default';
  if ('#accepted' in s) return 'secondary';
  if ('#cancelled' in s) return 'destructive';
  return 'outline';
}

function formatLocation(loc: Trip['pickupLocation']): string {
  const parts = [loc.area, loc.pincode].filter(Boolean);
  return parts.join(', ') || '—';
}

function formatDropoff(loc: Trip['dropoffLocation']): string {
  if (!loc || loc.length === 0) return '—';
  const l = loc[0];
  if (!l) return '—';
  const parts = [l.area, l.pincode].filter(Boolean);
  return parts.join(', ') || '—';
}

function formatDate(timestamp: bigint): string {
  try {
    const ms = Number(timestamp) / 1_000_000;
    return new Date(ms).toLocaleString();
  } catch {
    return '—';
  }
}

function formatFare(fare: bigint): string {
  const n = Number(fare);
  if (n === 0) return '—';
  return `₹${n}`;
}

export default function AdminTripsTab() {
  const { data: trips, isLoading } = useGetAllTrips();
  const [search, setSearch] = useState('');

  const filtered = (trips ?? []).filter((t) => {
    const q = search.toLowerCase();
    return (
      t.tripId.toLowerCase().includes(q) ||
      t.pickupLocation.area.toLowerCase().includes(q) ||
      (t.dropoffLocation.length > 0 && t.dropoffLocation[0]?.area.toLowerCase().includes(q))
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by trip ID or location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead>Dropoff</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fare (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {search ? 'No trips match your search.' : 'No trips found.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((trip) => (
                <TableRow key={trip.tripId}>
                  <TableCell className="font-mono text-xs">
                    {trip.customerId.toString().slice(0, 8)}…
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {trip.driverId.length > 0 && trip.driverId[0]
                      ? `${trip.driverId[0].toString().slice(0, 8)}…`
                      : '—'}
                  </TableCell>
                  <TableCell>{formatLocation(trip.pickupLocation)}</TableCell>
                  <TableCell>{formatDropoff(trip.dropoffLocation)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(trip.createdTime)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(trip)}>
                      {getStatusLabel(trip)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatFare(trip.totalFare)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
