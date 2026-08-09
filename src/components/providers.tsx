"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "@/lib/auth-store";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { PushPermissionBanner } from "@/components/push-subscribe";
import { OfflineBanner } from "@/components/offline-banner";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { BackgroundSync } from "@/components/background-sync";
import { PaymentReturn } from "@/components/payment-return";
import { propertyApi, api } from "@/lib/api";

// ── QueryClient — aggressive caching for PWA-like experience ─────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 5 min — no refetch if navigating back within this window
      staleTime: 1000 * 60 * 5,
      // Keep data in cache for 30 min after it's unused (back-button feels instant)
      gcTime: 1000 * 60 * 30,
      // Show cached data immediately while revalidating in background
      refetchOnWindowFocus: false,
      // Never throw — always show stale data + retry silently
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      // keepPreviousData equivalent — show old data while loading next page
      placeholderData: (prev: any) => prev,
    },
  },
});

// ── Background prefetch on app load ──────────────────────────────────────────
// Prefetch the most common pages so they feel instant on first tap

async function prefetchCritical() {
  if (typeof window === "undefined") return;

  // Stagger prefetches to not block the critical path
  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  // 1. Homepage listings (most visited)
  await delay(500);
  queryClient.prefetchQuery({
    queryKey: ["home-listings"],
    queryFn: () => propertyApi.list(1, 8),
    staleTime: 1000 * 60 * 5,
  });

  // 2. Amenities (needed for filters)
  await delay(200);
  queryClient.prefetchQuery({
    queryKey: ["amenities-rent"],
    queryFn: () => api.get<any>("/v1/user/amenities/rent"),
    staleTime: 1000 * 60 * 60, // 1hr — amenities don't change
  });

  // 3. If logged in — prefetch account data
  const { token, user } = useAuthStore.getState();
  if (token && user) {
    await delay(300);
    queryClient.prefetchQuery({
      queryKey: ["account-profile"],
      queryFn: () => api.get<any>("/v1/user/profile"),
      staleTime: 1000 * 60 * 5,
    });

    // Agent: prefetch their listings
    if (user.role === "agent" || user.role === "landlord") {
      await delay(200);
      queryClient.prefetchQuery({
        queryKey: ["my-listings"],
        queryFn: () => api.post<any>("/v1/landlordandagent/properties/1/50", {}),
        staleTime: 1000 * 60 * 2,
      });

      queryClient.prefetchQuery({
        queryKey: ["boost-balance"],
        queryFn: () => api.get<any>("/v1/user/boost/balance"),
        staleTime: 1000 * 60 * 2,
      });
    }
  }
}

// ── Link prefetch on route change / hover ─────────────────────────────────────
// Prefetches data for likely-next pages based on current location
function usePredictivePrefetch(pathname: string) {
  useEffect(() => {
    const { token, user } = useAuthStore.getState();

    // On homepage → prefetch property search
    if (pathname === "/") {
      queryClient.prefetchQuery({
        queryKey: ["properties", { page: 1, limit: 12 }],
        queryFn: () => propertyApi.search({ page: 1, limit: 12 }),
        staleTime: 1000 * 60 * 5,
      });
    }

    // On property list → prefetch first few individual properties
    if (pathname === "/properties") {
      const cached = queryClient.getQueryData<any>(["home-listings"]);
      if (cached?.properties?.slice) {
        cached.properties.slice(0, 3).forEach((p: any) => {
          if (p?._id) {
            queryClient.prefetchQuery({
              queryKey: ["property", p._id],
              queryFn: () => propertyApi.get(p._id),
              staleTime: 1000 * 60 * 5,
            });
          }
        });
      }
    }

    // On messages → prefetch chat list
    if (pathname === "/messages" && token) {
      queryClient.prefetchQuery({
        queryKey: ["chats"],
        queryFn: () => api.get<any>("/v1/user/chats"),
        staleTime: 1000 * 60,
      });
    }

    // On account → prefetch subscription status
    if (pathname === "/account" && token) {
      queryClient.prefetchQuery({
        queryKey: ["subscription-status"],
        queryFn: () => api.get<any>("/v1/user/subscription/status"),
        staleTime: 1000 * 60 * 5,
      });
    }
  }, [pathname]);
}

// ── App Shell ─────────────────────────────────────────────────────────────────

const ONBOARDING_PATHS = ["/onboarding", "/auth/login", "/auth/signup"];

function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrate = useAuthStore((s) => s.hydrate);
  const [ready, setReady] = useState(false);

  usePredictivePrefetch(pathname);

  useEffect(() => {
    hydrate();

    // Onboarding splash removed — no more forced redirect

    setReady(true);

    // Background prefetch after shell is ready
    prefetchCritical().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update ready on pathname change so back navigation is instant
  useEffect(() => {
    if (!ready) setReady(true);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const isOnboarding  = pathname.startsWith("/onboarding");
  const isAuthPage    = ONBOARDING_PATHS.some((p) => pathname.startsWith(p));
  const isPropertyPage = /^\/property\/[^/]+/.test(pathname);

  if (isOnboarding) return <>{children}</>;

  // Show children immediately with a fade-in — no more white flash
  // Auth guard on individual pages handles the actual protection
  return (
    <div className={ready ? "opacity-100 transition-opacity duration-150" : "opacity-0"}>
      <OfflineBanner />
      <div className={isPropertyPage ? "hidden lg:block" : ""}>
        <Navbar />
      </div>
      <main className={
        isPropertyPage
          ? "flex-1 lg:pt-[78px]"
          : "flex-1 pt-[72px] lg:pt-[78px] pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0"
      }>
        {children}
      </main>
      <div className="hidden lg:block">
        <Footer />
      </div>
      <div className={isPropertyPage ? "hidden" : ""}>
        <MobileNav />
      </div>
      <BackgroundSync />
      <PaymentReturn />
      <PWAInstallPrompt />
      <PushPermissionBanner />
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        {children}
      </AppShell>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: "Satoshi, sans-serif",
            fontSize: "14px",
            borderRadius: "12px",
            maxWidth: "360px",
          },
        }}
      />
    </QueryClientProvider>
  );
}

// Export queryClient so pages can imperatively prefetch on hover/focus
export { queryClient };
