import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { PricingConfig, UpdateConfigResult, TripRequest } from '../backend';
import { AppRole as BackendAppRole } from '../backend';
import type { Trip, UserProfile, AppRole } from '../lib/types';
import { withTimeout } from '../utils/withTimeout';
import { DEFAULT_CONFIG } from '../lib/defaultConfig';
import { toast } from 'sonner';

const QUERY_TIMEOUT_MS = 10_000;
const ROLE_TIMEOUT_MS = 5_000;

/**
 * Converts a plain role string to the correct Candid variant object format.
 * The backend expects { customer: null }, { driver: null }, or { admin: null }
 * wrapped in an opt (array) for the role field.
 */
export function convertRoleToVariant(role: 'customer' | 'driver'): { customer: null } | { driver: null } {
  if (role === 'customer') return { customer: null };
  return { driver: null };
}

// Get caller's user profile
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

// Get the caller's app role from the backend (admin | customer | driver | null)
export function useGetMyRole() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<AppRole | null>({
    queryKey: ['myRole', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const result = await withTimeout(actor.getMyRole(), ROLE_TIMEOUT_MS);
      if (result === null || result === undefined) return null;
      // Map backend AppRole enum to local AppRole string
      if (result === BackendAppRole.admin) return 'admin';
      if (result === BackendAppRole.customer) return 'customer';
      if (result === BackendAppRole.driver) return 'driver';
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

// Set the caller's role (customer or driver)
// Sends the correct Candid variant object format: { customer: null } or { driver: null }
export function useSetMyRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (role: 'customer' | 'driver') => {
      if (!actor) throw new Error('Actor not available');
      // Convert plain string to Candid variant object format required by the backend
      const backendRole = convertRoleToVariant(role);
      return withTimeout(actor.setMyRole(backendRole as any), ROLE_TIMEOUT_MS);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRole', identity?.getPrincipal().toString()] });
    },
  });
}

// Check if the current caller is an admin
export function useCheckIsAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<boolean>({
    queryKey: ['isAdmin', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return false;
      try {
        return await withTimeout(actor.isCallerAdmin(), QUERY_TIMEOUT_MS);
      } catch (err) {
        console.error('[useCheckIsAdmin] Failed:', err);
        return false;
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && !!identity && query.isFetched,
    isAdmin: query.data === true,
  };
}

// Save caller's user profile
export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Update user role — delegates to useSetMyRole for correct Candid variant encoding
export function useUpdateUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (role: AppRole) => {
      if (!actor) throw new Error('Actor not available');
      if (role === 'admin') throw new Error('Cannot set admin role via this method');
      // Convert plain string to Candid variant object format required by the backend
      const backendRole = convertRoleToVariant(role as 'customer' | 'driver');
      return withTimeout(actor.setMyRole(backendRole as any), ROLE_TIMEOUT_MS);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRole', identity?.getPrincipal().toString()] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Keep old name as alias for backward compatibility
export const useUpdateUserRoleAndLock = useUpdateUserRole;

// Upgrade current user to admin
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

// Create a new trip — calls actor.createTrip(tripData: TripRequest) with a single object argument
export function useCreateTrip() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripRequest: TripRequest) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.createTrip(tripRequest), QUERY_TIMEOUT_MS);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTrips'] });
      toast.success('Ride requested successfully');
    },
    onError: (err: unknown) => {
      console.error('Booking error:', err);
      toast.error('Booking failed. Please try again.');
    },
  });
}

// Get caller's trips
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

// Get requested trips (for drivers)
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

// Accept a trip (driver)
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

// Complete a trip (driver)
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

// Update driver availability
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

// Get all users (admin)
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

// Get all trips (admin)
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

// Get pricing config
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

// Update pricing config (admin)
export function useUpdatePricingConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: PricingConfig): Promise<UpdateConfigResult> => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.updatePricingConfig(config), QUERY_TIMEOUT_MS);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricingConfig'] });
    },
  });
}
