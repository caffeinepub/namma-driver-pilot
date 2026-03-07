import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type Trip as BackendTrip,
  type DriverProfile,
  type PricingConfig,
  Role,
  type TripRequest,
  type UserProfile,
} from "../backend";
import { type NormalizedTrip, normalizeTrip } from "../utils/normalizeTrip";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// ─── Role ─────────────────────────────────────────────────────────────────────

export function useGetMyRole() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity, isInitializing } = useInternetIdentity();
  // identityReady: session resolved (logged in OR confirmed logged out)
  const identityReady = !isInitializing;

  const query = useQuery<Role | null>({
    queryKey: ["myRole", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      const role = await actor.getMyRole();
      return role ?? null;
    },
    // Only fire after identity session is resolved AND actor is ready
    enabled: identityReady && !!actor && !actorFetching && !!identity,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && !!identity && query.isFetched,
    // Convenience alias: role === query.data
    role: query.data ?? null,
  };
}

export function useSetMyRoleCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      await actor.setMyRole(Role.customer);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["myRole", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useSetMyRoleDriver() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      await actor.setMyRole(Role.driver);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["myRole", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useCheckIsAdmin() {
  const { role, isLoading, isFetched, isError, refetch } = useGetMyRole();
  return {
    isAdmin: role === Role.admin,
    isLoading,
    isFetched,
    isError,
    refetch,
    data: role === Role.admin,
  };
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && !!identity && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["currentUserProfile", identity?.getPrincipal().toString()],
      });
    },
  });
}

// ─── Driver Profile ───────────────────────────────────────────────────────────

export function useGetDriverProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<DriverProfile | null>({
    queryKey: ["driverProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDriverProfile();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useUpsertDriverProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: DriverProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.upsertDriverProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driverProfile"] });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["availableTrips"] });
    },
  });
}

// ─── Trips ────────────────────────────────────────────────────────────────────

/**
 * Fetch trips for the current customer from the backend.
 * Accepts an optional callerPrincipal (kept for backward compat with CustomerDashboard).
 */
export function useGetCustomerTrips(_callerPrincipal?: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<NormalizedTrip[]>({
    queryKey: ["customerTrips"],
    queryFn: async (): Promise<NormalizedTrip[]> => {
      if (!actor) return [];
      const trips = await actor.getMyCustomerTrips();
      return trips.map(normalizeTrip);
    },
    enabled: !!actor && !actorFetching,
    placeholderData: [] as NormalizedTrip[],
  });
}

/**
 * Fetch trips assigned to the current driver from the backend.
 */
export function useGetMyDriverTrips() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<NormalizedTrip[]>({
    queryKey: ["driverTrips"],
    queryFn: async (): Promise<NormalizedTrip[]> => {
      if (!actor) return [];
      const trips = await actor.getMyDriverTrips();
      return trips.map(normalizeTrip);
    },
    enabled: !!actor && !actorFetching,
    placeholderData: [] as NormalizedTrip[],
  });
}

export function useGetAvailableTripsForDriver() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<NormalizedTrip[]>({
    queryKey: ["availableTrips"],
    queryFn: async (): Promise<NormalizedTrip[]> => {
      if (!actor) return [];
      const trips = await actor.getAvailableTripsForDriver();
      return trips.map(normalizeTrip);
    },
    enabled: !!actor && !actorFetching,
    placeholderData: [] as NormalizedTrip[],
  });
}

export function useGetAllTripsAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<NormalizedTrip[]>({
    queryKey: ["adminTrips"],
    queryFn: async (): Promise<NormalizedTrip[]> => {
      if (!actor) return [];
      const trips = await actor.getAllTripsAdmin();
      return trips.map(normalizeTrip);
    },
    enabled: !!actor && !actorFetching,
    placeholderData: [] as NormalizedTrip[],
  });
}

/** Alias kept for backward compatibility with AdminDashboard */
export const useGetAllTrips = useGetAllTripsAdmin;

export function useCreateTrip() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<BackendTrip, Error, TripRequest>({
    mutationFn: async (tripData: TripRequest): Promise<BackendTrip> => {
      if (!actor) throw new Error("Actor not available");
      return actor.createTrip(tripData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customerTrips"] });
      queryClient.invalidateQueries({ queryKey: ["availableTrips"] });
    },
  });
}

export function useAcceptTrip() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.acceptTrip(tripId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availableTrips"] });
      queryClient.invalidateQueries({ queryKey: ["driverTrips"] });
    },
  });
}

export function useCompleteTrip() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.completeTrip(tripId);
      if (result.__kind__ !== "ok") {
        throw new Error(`Failed to complete trip: ${result.__kind__}`);
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driverTrips"] });
      queryClient.invalidateQueries({ queryKey: ["availableTrips"] });
      queryClient.invalidateQueries({ queryKey: ["adminTrips"] });
    },
  });
}

// ─── Pricing Config ───────────────────────────────────────────────────────────

export function useGetPricingConfig() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PricingConfig>({
    queryKey: ["pricingConfig"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getPricingConfig();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useUpdatePricingConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<PricingConfig, Error, PricingConfig>({
    mutationFn: async (config: PricingConfig): Promise<PricingConfig> => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.updatePricingConfig(config);
      if (result.__kind__ !== "ok") {
        if (result.__kind__ === "invalidConfig") {
          throw new Error(`Invalid config: ${result.invalidConfig}`);
        }
        if (result.__kind__ === "notAdmin") {
          throw new Error("Not authorized to update pricing");
        }
        throw new Error(`Failed to update pricing config: ${result.__kind__}`);
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricingConfig"] });
    },
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useGetAllUsers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return [];
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useListAdmins() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery({
    queryKey: ["adminList"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAdmins();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function usePersistentAdminCheck() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["persistentAdminCheck"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.persistentAdminCheck();
    },
    enabled: !!actor && !actorFetching,
  });
}

/**
 * Stub hook for AdminUpgradePage.
 * The backend uses hardcoded admin principals — there is no runtime upgrade endpoint.
 * This mutation always rejects with a clear message so the UI can inform the user.
 */
export function useUpgradeToAdmin() {
  return useMutation<null, Error, string>({
    mutationFn: async (_code: string): Promise<null> => {
      throw new Error(
        "Admin access is managed by hardcoded principals. Contact the platform administrator to be added as an admin.",
      );
    },
  });
}
