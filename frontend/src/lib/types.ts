import type { Principal } from '@dfinity/principal';

// ─── Role ─────────────────────────────────────────────────────────────────────

export type AppRole = 'customer' | 'driver' | 'admin';

/**
 * RoleVariant covers both the Candid variant object format and legacy '#' prefix format.
 */
export type RoleVariant =
  | { admin: null }
  | { customer: null }
  | { driver: null }
  | { unassigned: null }
  | { '#customer': null }
  | { '#driver': null }
  | { '#admin': null }
  | { '#unassigned': null };

/**
 * Safely normalizes a role value returned from the backend actor.
 * Handles plain strings, Candid variant objects, legacy '#' prefix, and null/undefined.
 * Returns the normalized role string (without '#' prefix), or '' as a safe fallback.
 */
export function normalizeRole(role: unknown): string {
  if (role === null || role === undefined) return '';
  if (typeof role === 'string') {
    return role.startsWith('#') ? role.slice(1) : role;
  }
  if (typeof role === 'object' && !Array.isArray(role)) {
    const keys = Object.keys(role as object);
    if (keys.length > 0) {
      const key = keys[0];
      return key.startsWith('#') ? key.slice(1) : key;
    }
  }
  return '';
}

/**
 * Converts any role value (Candid variant, plain string, array-wrapped, etc.)
 * into a normalized AppRole string. Returns null for unrecognized/unassigned roles.
 */
export function getRoleString(role: unknown): AppRole | null {
  if (role === null || role === undefined) return null;

  // Handle optional array wrapper: [] | [Role]
  if (Array.isArray(role)) {
    if (role.length === 0) return null;
    return getRoleString(role[0]);
  }

  const normalized = normalizeRole(role);
  if (!normalized) return null;

  if (normalized === 'admin') return 'admin';
  if (normalized === 'driver') return 'driver';
  if (normalized === 'customer') return 'customer';
  return null;
}

/**
 * Returns a display label for any role value.
 */
export function getRoleLabel(role: unknown): string {
  const r = getRoleString(role);
  switch (r) {
    case 'admin': return 'Admin';
    case 'driver': return 'Driver';
    case 'customer': return 'Customer';
    default: return 'Unknown';
  }
}

/**
 * Returns the badge variant for a role.
 */
export function getRoleBadgeVariant(role: unknown): 'default' | 'secondary' | 'outline' | 'destructive' {
  const r = getRoleString(role);
  if (r === 'admin') return 'default';
  if (r === 'driver') return 'secondary';
  if (r === 'customer') return 'outline';
  return 'outline';
}

// ─── Trip Types ───────────────────────────────────────────────────────────────

export type TripStatus =
  | { '#requested': null }
  | { '#accepted': null }
  | { '#completed': null }
  | { '#cancelled': null }
  | { requested: null }
  | { accepted: null }
  | { completed: null }
  | { cancelled: null };

export type TripType =
  | { '#local': null }
  | { '#outstation': null }
  | { local: null }
  | { outstation: null };

export type VehicleType =
  | { '#hatchback': null }
  | { '#sedan': null }
  | { '#suv': null }
  | { '#luxury': null }
  | { hatchback: null }
  | { sedan: null }
  | { suv: null }
  | { luxury: null };

export type JourneyType =
  | { '#oneWay': null }
  | { '#roundTrip': null }
  | { oneWay: null }
  | { roundTrip: null };

export type Duration =
  | { '#hours': bigint }
  | { '#days': bigint }
  | { hours: bigint }
  | { days: bigint };

export interface Location {
  pincode: string;
  area: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Trip {
  tripId: string;
  customerId: Principal;
  driverId: [] | [Principal];
  tripType: TripType;
  journeyType: JourneyType;
  vehicleType: VehicleType;
  duration: Duration;
  startDateTime: [] | [bigint];
  endDateTime: [] | [bigint];
  pickupLocation: Location;
  dropoffLocation: [] | [Location];
  phone: string;
  landmark: [] | [string];
  status: TripStatus;
  createdTime: bigint;
  totalFare: bigint;
  ratePerHour: bigint;
  billableHours: bigint;
}

export type VehicleExperience =
  | { hatchback: null }
  | { sedan: null }
  | { suv: null }
  | { luxury: null };

export type TransmissionComfort =
  | { manual: null }
  | { automatic: null }
  | { ev: null };

/**
 * Local UserProfile type — mirrors the backend UserProfile but uses
 * `languages?: string[]` to be compatible with both the backend type
 * (which uses `string[] | undefined`) and Candid optional array format.
 */
export interface UserProfile {
  principalId: Principal;
  fullName: string;
  email: string;
  role: RoleVariant | [] | [RoleVariant] | unknown;
  createdTime: bigint;
  servicePincode: string;
  serviceAreaName: string;
  vehicleExperience: VehicleExperience[];
  transmissionComfort: TransmissionComfort[];
  isAvailable: boolean;
  totalEarnings: bigint;
  /** Compatible with both `string[] | undefined` (backend) and `[] | [string[]]` (Candid) */
  languages?: string[] | null;
}

export type PricingConfig = import('../backend').PricingConfig;
