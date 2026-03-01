import type { Principal } from '@dfinity/principal';
import { normalizeRole } from '../utils/normalizeRole';

// All domain types defined locally since they are not exported from the backend interface

export type AppRole = 'customer' | 'driver' | 'admin';

export type TripStatus = 'requested' | 'accepted' | 'completed' | 'cancelled';

export type TripType = 'local' | 'outstation';

export type JourneyType = 'oneWay' | 'roundTrip';

export type VehicleType = 'hatchback' | 'sedan' | 'suv' | 'luxury';

export type TransmissionComfort = 'manual' | 'automatic' | 'ev';

export type VehicleExperience = 'hatchback' | 'sedan' | 'suv' | 'luxury';

export type Duration =
  | { readonly '#hours': bigint }
  | { readonly '#days': bigint };

export type Location = {
  pincode: string;
  area: string;
  latitude: [] | [number];
  longitude: [] | [number];
};

/**
 * RoleVariant covers both the old Candid optional-array format and the new direct variant format.
 * At runtime the backend returns a Candid variant object like { admin: null } (keys without '#').
 */
export type RoleVariant =
  | { admin: null }
  | { customer: null }
  | { driver: null }
  // Legacy format with '#' prefix (kept for backwards compat)
  | { '#customer': null }
  | { '#driver': null }
  | { '#admin': null };

export type UserProfile = {
  principalId: Principal;
  email: string;
  fullName: string;
  /**
   * role is a Candid variant object at runtime: { admin: null } | { customer: null } | { driver: null }
   * It may also arrive wrapped in an optional array [] | [RoleVariant] from older builds.
   * Use getRoleString() to safely extract the role string.
   */
  role: RoleVariant | [] | [RoleVariant] | unknown;
  createdTime: bigint;
  servicePincode: string;
  serviceAreaName: string;
  vehicleExperience: Array<{ '#hatchback': null } | { '#sedan': null } | { '#suv': null } | { '#luxury': null }>;
  transmissionComfort: Array<{ '#manual': null } | { '#automatic': null } | { '#ev': null }>;
  isAvailable: boolean;
  totalEarnings: bigint;
  languages: [] | [string[]];
};

export type Trip = {
  tripId: string;
  customerId: Principal;
  driverId: [] | [Principal];
  tripType: { '#local': null } | { '#outstation': null };
  journeyType: { '#oneWay': null } | { '#roundTrip': null };
  vehicleType: { '#hatchback': null } | { '#sedan': null } | { '#suv': null } | { '#luxury': null };
  duration: { '#hours': bigint } | { '#days': bigint };
  startDateTime: [] | [bigint];
  endDateTime: [] | [bigint];
  pickupLocation: Location;
  dropoffLocation: [] | [Location];
  phone: string;
  landmark: [] | [string];
  status: { '#requested': null } | { '#accepted': null } | { '#completed': null } | { '#cancelled': null };
  createdTime: bigint;
  totalFare: bigint;
  ratePerHour: bigint;
  billableHours: bigint;
};

/**
 * Safely extract the role string from any role value returned by the backend.
 *
 * Handles all formats:
 *   - Direct Candid variant object: { admin: null } → "admin"
 *   - Legacy Candid variant with '#' prefix: { '#admin': null } → "admin"
 *   - Optional array wrapper: [] | [{ admin: null }]
 *   - Plain string: "admin" → "admin"
 *   - null / undefined → null
 */
export function getRoleString(role: unknown): AppRole | null {
  if (role === null || role === undefined) return null;

  // Handle optional array wrapper: [] | [variant]
  if (Array.isArray(role)) {
    if (role.length === 0) return null;
    return getRoleString(role[0]);
  }

  // Use normalizeRole to handle both plain strings and variant objects
  const normalized = normalizeRole(role);
  if (!normalized) return null;

  // Strip leading '#' if present (legacy format)
  const key = normalized.startsWith('#') ? normalized.slice(1) : normalized;

  if (key === 'admin') return 'admin';
  if (key === 'driver') return 'driver';
  if (key === 'customer') return 'customer';
  return null;
}
