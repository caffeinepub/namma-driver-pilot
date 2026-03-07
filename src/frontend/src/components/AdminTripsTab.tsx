import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { useState } from "react";
import { useGetAllTripsAdmin } from "../hooks/useQueries";
import type { NormalizedTrip } from "../utils/normalizeTrip";

function getStatusLabel(status: string): string {
  if (status === "requested") return "Requested";
  if (status === "accepted") return "Accepted";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return "Unknown";
}

function getStatusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "completed") return "default";
  if (status === "accepted") return "secondary";
  if (status === "cancelled") return "destructive";
  return "outline";
}

function formatLocation(loc: NormalizedTrip["pickupLocation"]): string {
  const parts = [loc.area, loc.pincode].filter(Boolean);
  return parts.join(", ") || "—";
}

function formatDropoff(loc: NormalizedTrip["dropoffLocation"]): string {
  if (loc == null) return "—";
  const parts = [loc.area, loc.pincode].filter(Boolean);
  return parts.join(", ") || "—";
}

function formatDate(timestamp: bigint): string {
  try {
    const ms = Number(timestamp) / 1_000_000;
    return new Date(ms).toLocaleString();
  } catch {
    return "—";
  }
}

function formatFare(fare: bigint): string {
  const n = Number(fare);
  if (n === 0) return "—";
  return `₹${n}`;
}

export default function AdminTripsTab() {
  const { data: trips, isLoading } = useGetAllTripsAdmin();
  const [search, setSearch] = useState("");

  const filtered = (trips ?? []).filter((t) => {
    const q = search.toLowerCase();
    const dropArea =
      t.dropoffLocation != null ? t.dropoffLocation.area.toLowerCase() : "";
    return (
      t.tripId.toLowerCase().includes(q) ||
      t.pickupLocation.area.toLowerCase().includes(q) ||
      dropArea.includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {["s1", "s2", "s3", "s4", "s5"].map((k) => (
          <Skeleton key={k} className="h-12 w-full" />
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
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  {search ? "No trips match your search." : "No trips found."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((trip) => (
                <TableRow key={trip.tripId}>
                  <TableCell className="font-mono text-xs">
                    {trip.customerId.toString().slice(0, 8)}…
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {trip.driverId !== null
                      ? `${trip.driverId.toString().slice(0, 8)}…`
                      : "—"}
                  </TableCell>
                  <TableCell>{formatLocation(trip.pickupLocation)}</TableCell>
                  <TableCell>{formatDropoff(trip.dropoffLocation)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(trip.createdTime)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(trip.status)}>
                      {getStatusLabel(trip.status)}
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
