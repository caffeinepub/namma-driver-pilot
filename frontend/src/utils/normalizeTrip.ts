import type { Trip as BackendTrip } from '../backend';
import type { Principal } from '@dfinity/principal';

/**
 * A normalized trip where status, tripType, journeyType, and vehicleType
 * are plain strings — safe for === comparisons without the `in` operator.
 */
export interface NormalizedTrip {
  tripId: string;
  customerId: Principal;
  driverId: Principal | null;
  tripType: 'local' | 'outstation' | string;
  journeyType: 'oneWay' | 'roundTrip' | string;
  vehicleType: 'hatchback' | 'sedan' | 'suv' | 'luxury' | string;
  duration: BackendTrip['duration'];
  startDateTime: bigint | null;
  endDateTime: bigint | null;
  pickupLocation: BackendTrip['pickupLocation'];
  dropoffLocation: BackendTrip['dropoffLocation'] | null;
  phone: string;
  landmark: string | null;
  status: 'requested' | 'accepted' | 'completed' | 'cancelled' | string;
  createdTime: bigint;
  totalFare: bigint;
  ratePerHour: bigint;
  billableHours: bigint;
}

/**
 * Extracts a plain string key from any of the three Candid variant forms:
 *   (a) plain string:           "requested"
 *   (b) hash-prefixed string:   "#requested"
 *   (c) variant object:         { requested: null } or { '#requested': null }
 */
function extractVariantKey(value: unknown): string {
  if (typeof value === 'string') {
    return value.startsWith('#') ? value.slice(1) : value;
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const keys = Object.keys(value as object);
    if (keys.length > 0) {
      const key = keys[0];
      return key.startsWith('#') ? key.slice(1) : key;
    }
  }
  return '';
}

/**
 * Normalizes a raw backend Trip into a NormalizedTrip with plain string fields.
 * Handles all three Candid variant forms for status, tripType, journeyType, vehicleType.
 */
export function normalizeTrip(raw: BackendTrip): NormalizedTrip {
  return {
    tripId: raw.tripId,
    customerId: raw.customerId,
    driverId: raw.driverId ?? null,
    tripType: extractVariantKey(raw.tripType),
    journeyType: extractVariantKey(raw.journeyType),
    vehicleType: extractVariantKey(raw.vehicleType),
    duration: raw.duration,
    startDateTime: raw.startDateTime ?? null,
    endDateTime: raw.endDateTime ?? null,
    pickupLocation: raw.pickupLocation,
    dropoffLocation: raw.dropoffLocation ?? null,
    phone: raw.phone,
    landmark: raw.landmark ?? null,
    status: extractVariantKey(raw.status),
    createdTime: raw.createdTime,
    totalFare: raw.totalFare,
    ratePerHour: raw.ratePerHour,
    billableHours: raw.billableHours,
  };
}
