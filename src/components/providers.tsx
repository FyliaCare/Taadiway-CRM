"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc/client";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { PreferencesProvider } from "@/lib/preferences-context";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
        cacheTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Enable query deduplication
        networkMode: 'online',
        // Prefetch on hover for better UX
        refetchOnMount: false,
      },
      mutations: {
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        networkMode: 'online',
      },
    },
  }));

  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_APP_URL}/api/trpc`,
          // Enable batching for better performance
          maxURLLength: 2083,
          // Add headers for caching
          headers() {
            return {
              'x-trpc-source': 'react',
            };
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <PreferencesProvider>
            {children}
          </PreferencesProvider>
        </SessionProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
