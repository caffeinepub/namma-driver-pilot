import type { Principal } from '@dfinity/principal';

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

export type RoleVariant = { '#customer': null } | { '#driver': null } | { '#admin': null };

export type UserProfile = {
  principalId: Principal;
  email: string;
  fullName: string;
  role: [] | [RoleVariant];
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
 * Extract the role string from a Candid optional variant.
 * Returns null if no role is set.
 */
export function getRoleString(role: UserProfile['role']): AppRole | null {
  if (!role || role.length === 0) return null;
  const variant = role[0];
  if (!variant) return null;
  if ('#customer' in variant) return 'customer';
  if ('#driver' in variant) return 'driver';
  if ('#admin' in variant) return 'admin';
  return null;
}
