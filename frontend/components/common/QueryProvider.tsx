"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { STALE_TIMES } from "@/lib/utils/constants";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIMES.dashboard,
        retry: (failureCount, error) => {
          // Don't retry on 401/403
          if (error instanceof Error && "status" in error) {
            const status = (error as { status: number }).status;
            if (status === 401 || status === 403) return false;
          }
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
