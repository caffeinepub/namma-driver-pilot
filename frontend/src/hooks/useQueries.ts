import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Trip, UserProfile, AppRole, TripType, JourneyType, Duration, Location, Time } from '../backend';

// Get caller's user profile
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
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

// Save caller's user profile
export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Update user role (calls backend updateUserRole)
export function useUpdateUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (role: AppRole) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateUserRole(role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Keep old name as alias for backward compatibility with any remaining references
export const useUpdateUserRoleAndLock = useUpdateUserRole;

// Upgrade current user to admin using a secret setup code
export function useUpgradeToAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string): Promise<string | null> => {
      if (!actor) throw new Error('Actor not available');
      return actor.upgradeCurrentUserToAdmin(code);
    },
    onSuccess: (result) => {
      // null result means success (no error message returned)
      if (result === null) {
        queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      }
    },
  });
}

// Define VehicleType locally since it's used in Trip but not exported from backend
type VehicleType = 'hatchback' | 'sedan' | 'suv' | 'luxury';

// Create a new trip with comprehensive fields
export function useCreateTrip() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripType,
      journeyType,
      vehicleType,
      duration,
      startDateTime,
      endDateTime,
      pickupLocation,
      dropoffLocation,
      phone,
      landmark,
    }: {
      tripType: TripType;
      journeyType: JourneyType;
      vehicleType: VehicleType;
      duration: Duration;
      startDateTime: Time | null;
      endDateTime: Time | null;
      pickupLocation: Location;
      dropoffLocation: Location | null;
      phone: string;
      landmark: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTrip(
        tripType,
        journeyType,
        vehicleType as any,
        duration,
        startDateTime,
        endDateTime,
        pickupLocation,
        dropoffLocation,
        phone,
        landmark
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTrips'] });
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
      return actor.getMyTrips();
    },
    enabled: !!actor && !actorFetching,
  });
}

// Get requested trips (for drivers)
export function useGetRequestedTrips() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Trip[]>({
    queryKey: ['requestedTrips'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRequestedTrips();
    },
    enabled: !!actor && !actorFetching,
  });
}

// Accept a trip (driver)
export function useAcceptTrip() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.acceptTrip(tripId);
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
      return actor.completeTrip(tripId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTrips'] });
      // Also refresh profile so availability reflects latest saved value after unlock
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Update driver availability — blocked by backend when accepted trip exists
export function useUpdateAvailability() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isAvailable: boolean) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateAvailability(isAvailable);
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
      return actor.getAllUsers();
    },
    enabled: !!actor && !actorFetching,
  });
}

// Get all trips (admin)
export function useGetAllTrips() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Trip[]>({
    queryKey: ['allTrips'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTrips();
    },
    enabled: !!actor && !actorFetching,
  });
}
