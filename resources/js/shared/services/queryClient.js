import { MutationCache, QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    mutationCache: new MutationCache({
        onSuccess: () => {
            void queryClient.invalidateQueries({ refetchType: 'none' });
        },
    }),
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: 1,
        },
        mutations: {
            retry: 0,
        },
    },
});
