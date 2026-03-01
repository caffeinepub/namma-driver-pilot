import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type {
  PricingConfig,
  UpdateConfigResult,
  TripRequest,
  ProfileInput,
  TransmissionType as BackendTransmissionType,
  DriverProfile,
  Trip as BackendTrip,
} from '../backend';
import type { Trip, UserProfile, AppRole } from '../lib/types';
import { withTimeout } from '../utils/withTimeout';
import { DEFAULT_CONFIG } from '../lib/defaultConfig';
import { normalizeRole } from '../utils/normalizeRole';
import { toast } from 'sonner';

const QUERY_TIMEOUT_MS = 30_000;
const ROLE_TIMEOUT_MS = 30_000;

/**
 * Input type for saving a caller's user profile.
 */
export interface SaveProfileInput {
  fullName: string;
  email: string;
  serviceAreaName?: string;
  servicePincode?: string;
  vehicleExperience?: string[];
  transmissionComfort?: string[];
  languages?: string[];
  isAvailable?: boolean;
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout((actor as any).getCallerUserProfile(), QUERY_TIMEOUT_MS);
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

// ─── Role ─────────────────────────────────────────────────────────────────────

export function useGetMyRole() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<AppRole | null>({
    queryKey: ['myRole', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const result = await withTimeout(actor.getMyRole(), ROLE_TIMEOUT_MS);
      if (result === null || result === undefined) return null;
      // Use normalizeRole to safely handle both string and object variant formats
      // e.g. "admin" or { admin: null } both normalize to "admin"
      const normalized = normalizeRole(result);
      if (normalized === 'admin') return 'admin';
      if (normalized === 'customer') return 'customer';
      if (normalized === 'driver') return 'driver';
      return null;
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && !!identity && query.isFetched,
    role: query.data ?? null,
  };
}

export function useSetMyRoleCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.setMyRoleCustomer(), ROLE_TIMEOUT_MS);
    },
    retry: 1,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRole', identity?.getPrincipal().toString()] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (err: unknown) => {
      console.error('[useSetMyRoleCustomer] Failed:', err);
      toast.error('Failed to set role. Please try again.');
    },
  });
}

export function useSetMyRoleDriver() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.setMyRoleDriver(), ROLE_TIMEOUT_MS);
    },
    retry: 1,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRole', identity?.getPrincipal().toString()] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (err: unknown) => {
      console.error('[useSetMyRoleDriver] Failed:', err);
      toast.error('Failed to set role. Please try again.');
    },
  });
}

// Legacy alias
export function useSetMyRole() {
  const setCustomer = useSetMyRoleCustomer();
  const setDriver = useSetMyRoleDriver();

  return {
    mutateAsync: async (role: 'customer' | 'driver') => {
      if (role === 'customer') return setCustomer.mutateAsync();
      return setDriver.mutateAsync();
    },
    isPending: setCustomer.isPending || setDriver.isPending,
    isError: setCustomer.isError || setDriver.isError,
    isSuccess: setCustomer.isSuccess || setDriver.isSuccess,
  };
}

export function useCheckIsAdmin() {
  const { role, isLoading, isFetched, isError, refetch } = useGetMyRole();

  return {
    isAdmin: role === 'admin',
    isLoading,
    isFetched,
    isError,
    refetch,
    data: role === 'admin',
  };
}

export function useUpdateUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (role: AppRole) => {
      if (!actor) throw new Error('Actor not available');
      if (role === 'admin') throw new Error('Cannot set admin role via this method');
      if (role === 'customer') {
        return withTimeout(actor.setMyRoleCustomer(), ROLE_TIMEOUT_MS);
      }
      return withTimeout(actor.setMyRoleDriver(), ROLE_TIMEOUT_MS);
    },
    retry: 1,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRole', identity?.getPrincipal().toString()] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (err: unknown) => {
      console.error('[useUpdateUserRole] Failed:', err);
      toast.error('Failed to update role. Please try again.');
    },
  });
}

export const useUpdateUserRoleAndLock = useUpdateUserRole;

export function useUpgradeToAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_code: string): Promise<string | null> => {
      if (!actor) throw new Error('Actor not available');
      return 'Admin access is determined by your principal ID. Contact the system owner to be added as an admin.';
    },
    onSuccess: (result) => {
      if (result === null) {
        queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      }
    },
  });
}

// ─── Profile Save ─────────────────────────────────────────────────────────────

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveProfileInput) => {
      if (!actor) throw new Error('Actor not available');

      const profileInput: ProfileInput = {
        fullName: input.fullName.trim(),
        email: input.email.trim(),
      };

      const savedProfile = await withTimeout(actor.setProfile(profileInput), QUERY_TIMEOUT_MS);

      const hasDriverFields =
        input.serviceAreaName !== undefined ||
        input.servicePincode !== undefined ||
        input.vehicleExperience !== undefined ||
        input.transmissionComfort !== undefined ||
        input.languages !== undefined ||
        input.isAvailable !== undefined;

      if (hasDriverFields) {
        const vehicleExperience = (input.vehicleExperience ?? []) as any[];
        const transmissionComfort = (input.transmissionComfort ?? []) as BackendTransmissionType[];

        return withTimeout(
          actor.updateProfile({
            fullName: input.fullName.trim(),
            email: input.email.trim(),
            serviceAreaName: input.serviceAreaName ?? (savedProfile as any).serviceAreaName ?? '',
            servicePincode: input.servicePincode ?? (savedProfile as any).servicePincode ?? '',
            vehicleExperience,
            transmissionComfort,
            languages: input.languages,
            isAvailable: input.isAvailable ?? (savedProfile as any).isAvailable ?? false,
            totalEarnings: (savedProfile as any).totalEarnings ?? BigInt(0),
          }),
          QUERY_TIMEOUT_MS
        );
      }

      return savedProfile;
    },
    retry: 1,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (err: unknown) => {
      console.error('[useSaveCallerUserProfile] Failed:', err);
      toast.error('Failed to save profile. Please try again.');
    },
  });
}

// ─── Driver Profile ───────────────────────────────────────────────────────────

export function useGetDriverProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<DriverProfile | null>({
    queryKey: ['driverProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.getDriverProfile(), QUERY_TIMEOUT_MS);
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useUpsertDriverProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: DriverProfile) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.upsertDriverProfile(profile), QUERY_TIMEOUT_MS);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (err: unknown) => {
      console.error('[useUpsertDriverProfile] Failed:', err);
    },
  });
}

// ─── Trips ────────────────────────────────────────────────────────────────────

/**
 * Create a trip and return the newly created Trip object from the backend.
 * The returned trip can be used for optimistic UI updates.
 */
export function useCreateTrip() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<BackendTrip, Error, TripRequest>({
    mutationFn: async (tripRequest: TripRequest): Promise<BackendTrip> => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.createTrip(tripRequest), QUERY_TIMEOUT_MS);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerTrips'] });
      queryClient.invalidateQueries({ queryKey: ['requestedTrips'] });
      toast.success('Ride requested successfully');
    },
    onError: (err: unknown) => {
      console.error('Booking error:', err);
      toast.error('Booking failed. Please try again.');
    },
  });
}

/**
 * Fetch all trips from the backend and filter client-side by the caller's principal.
 * Falls back to an empty array if the backend method is unavailable.
 */
export function useGetCustomerTrips(callerPrincipal: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Trip[]>({
    queryKey: ['customerTrips', callerPrincipal],
    queryFn: async () => {
      if (!actor || !callerPrincipal) return [];
      try {
        const allTrips: Trip[] = await withTimeout(
          (actor as any).getAllTrips(),
          QUERY_TIMEOUT_MS
        );
        if (!Array.isArray(allTrips)) return [];
        // Filter to only trips belonging to this customer
        return allTrips.filter((trip) => {
          const cid = trip.customerId;
          if (!cid) return false;
          const cidStr = typeof cid === 'object' && 'toString' in cid
            ? cid.toString()
            : String(cid);
          return cidStr === callerPrincipal;
        });
      } catch (err) {
        console.error('[useGetCustomerTrips] Failed to fetch trips:', err);
        return [];
      }
    },
    enabled: !!actor && !actorFetching && !!callerPrincipal,
    placeholderData: [],
  });
}

export function useGetMyTrips() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Trip[]>({
    queryKey: ['myTrips'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await withTimeout((actor as any).getMyTrips(), QUERY_TIMEOUT_MS);
      } catch (err) {
        console.error('[useGetMyTrips] Failed:', err);
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
    placeholderData: [],
  });
}

export function useGetRequestedTrips() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Trip[]>({
    queryKey: ['requestedTrips'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await withTimeout((actor as any).getRequestedTrips(), QUERY_TIMEOUT_MS);
      } catch (err) {
        console.error('[useGetRequestedTrips] Failed:', err);
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
    placeholderData: [],
  });
}

export function useAcceptTrip() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).acceptTrip(tripId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requestedTrips'] });
      queryClient.invalidateQueries({ queryKey: ['myTrips'] });
    },
  });
}

export function useCompleteTrip() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).completeTrip(tripId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTrips'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useUpdateAvailability() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isAvailable: boolean) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).updateAvailability(isAvailable);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useGetAllUsers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await withTimeout((actor as any).getAllUsers(), QUERY_TIMEOUT_MS);
      } catch (err) {
        console.error('[useGetAllUsers] Failed:', err);
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
    placeholderData: [],
  });
}

export function useGetAllTrips() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Trip[]>({
    queryKey: ['allTrips'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await withTimeout((actor as any).getAllTrips(), QUERY_TIMEOUT_MS);
      } catch (err) {
        console.error('[useGetAllTrips] Failed:', err);
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
    placeholderData: [],
  });
}

// ─── Pricing Config ───────────────────────────────────────────────────────────

export function useGetPricingConfig() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PricingConfig>({
    queryKey: ['pricingConfig'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.getPricingConfig(), QUERY_TIMEOUT_MS);
    },
    enabled: !!actor && !actorFetching,
    retry: false,
    placeholderData: DEFAULT_CONFIG,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdatePricingConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: PricingConfig): Promise<UpdateConfigResult> => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.updatePricingConfig(config), QUERY_TIMEOUT_MS);
    },
    onSuccess: (result) => {
      if (result.__kind__ === 'ok') {
        queryClient.invalidateQueries({ queryKey: ['pricingConfig'] });
      }
    },
  });
}
