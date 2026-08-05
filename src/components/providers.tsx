"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "@/lib/auth-store";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { PushPermissionBanner } from "@/components/push-subscribe";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();

    // Only redirect to onboarding on first-ever visit, and not on auth/onboarding pages
    const onboardingPaths = ["/onboarding", "/auth/login", "/auth/signup"];
    if (onboardingPaths.some((p) => pathname.startsWith(p))) return;

    const onboarded = localStorage.getItem("BT_ONBOARDED");
    if (!onboarded) {
      router.replace("/onboarding");
    }
  }, [hydrate, pathname, router]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <OnboardingGate>
        {children}
        <PWAInstallPrompt />
        <PushPermissionBanner />
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
      </OnboardingGate>
    </QueryClientProvider>
  );
}
