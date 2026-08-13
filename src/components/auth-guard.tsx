"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

/**
 * AuthGuard — protects pages that require login.
 *
 * Fast path: reads token synchronously from the store (already hydrated by AppShell).
 * No spinner, no layout shift — protected content renders immediately if logged in,
 * redirects immediately if not.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Read synchronously — AppShell hydrates the store before any page renders
  const token = useAuthStore.getState().token;

  useEffect(() => {
    // Double-check after mount in case hydration was delayed
    const currentToken = useAuthStore.getState().token;
    if (!currentToken) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If no token, render nothing (redirect happens in useEffect)
  if (!token) return null;

  // Token exists — render immediately, no spinner
  return <>{children}</>;
}
