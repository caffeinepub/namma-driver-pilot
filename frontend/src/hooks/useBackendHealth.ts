import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { withTimeout } from '../utils/withTimeout';

const HEALTH_TIMEOUT_MS = 10_000;

export function useBackendHealth() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<boolean>({
    queryKey: ['backendHealth'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        const result = await withTimeout(actor.health(), HEALTH_TIMEOUT_MS);
        return result === 'ok';
      } catch (err) {
        console.error('[useBackendHealth] Health check failed:', err);
        return false;
      }
    },
    enabled: !!actor && !actorFetching,
    staleTime: Infinity,
    retry: false,
  });

  return {
    isHealthy: query.data !== false,
    isChecking: actorFetching || query.isLoading,
    error: query.error,
  };
}
