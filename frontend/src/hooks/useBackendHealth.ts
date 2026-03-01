import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';

export function useBackendHealth() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<boolean>({
    queryKey: ['backendHealth'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        const result = await (actor as any).ping();
        if (result === 'ok') {
          console.log('[Health] ping() returned ok — backend is reachable');
          return true;
        }
        console.warn('[Health] ping() returned unexpected value:', result);
        return false;
      } catch (err) {
        console.error('[Health] ping() failed — backend unreachable');
        console.error('[Health] Error:', err);
        return false;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: 1,
    staleTime: 30_000,
  });

  return {
    isHealthy: query.data === true,
    isChecking: actorFetching || query.isLoading,
    error: query.error,
  };
}
