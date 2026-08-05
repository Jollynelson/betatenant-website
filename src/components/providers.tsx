"use client";

import { useEffect, useState } from "react";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ONBOARDING_PATHS = ["/onboarding", "/auth/login", "/auth/signup"];

function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrate = useAuthStore((s) => s.hydrate);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate();

    // Redirect to onboarding only on mobile, only first visit, not on excluded paths
    if (!ONBOARDING_PATHS.some((p) => pathname.startsWith(p))) {
      const onboarded = localStorage.getItem("BT_ONBOARDED");
      const isMobile = window.innerWidth < 768;
      if (!onboarded && isMobile) {
        router.replace("/onboarding");
        return;
      }
    }

    setReady(true);
  }, [hydrate, pathname, router]);

  const isOnboarding = pathname.startsWith("/onboarding");
  const isAuthPage = ONBOARDING_PATHS.some((p) => pathname.startsWith(p));

  // On onboarding: render children fullscreen, no chrome
  if (isOnboarding) {
    return <>{children}</>;
  }

  // While doing the onboarding redirect check, render nothing to avoid flash
  if (!ready && !isAuthPage) return null;

  return (
    <>
      <OfflineBanner />
      <Navbar />
      <main className="flex-1 pt-[72px] lg:pt-[78px] pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </main>
      <div className="hidden lg:block">
        <Footer />
      </div>
      <MobileNav />
      <PWAInstallPrompt />
      <PushPermissionBanner />
    </>
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
