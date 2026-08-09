"use client";

/**
 * PaymentReturn — handles redirect-back from Paystack/Bachs payment pages.
 *
 * Runs on every page load. Checks URL params for payment results and:
 * - Shows the right success/failure toast
 * - Redirects to the right page
 * - Cleans up URL params
 *
 * Params handled:
 *   ?success=1&returnTo=...   → subscription success
 *   ?boosted=1&returnTo=...   → boost credit purchase success
 *   ?boostPropertyId=...&boostType=... → auto-boost already done server-side, show feedback
 *   ?payment_cancelled=1      → payment was cancelled
 */

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";

export function PaymentReturn() {
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);

    // ── Subscription success ───────────────────────────────────────────────
    if (params.get("success") === "1" && pathname.startsWith("/account/subscription")) {
      // Handled inline by the subscription page — skip here
      return;
    }

    // ── Boost credits purchased ────────────────────────────────────────────
    if (params.get("boosted") === "1") {
      const boostPropertyId = params.get("boostPropertyId");
      const boostType       = params.get("boostType") ?? "boost";
      const returnTo        = params.get("returnTo");

      if (boostPropertyId) {
        // Server already applied the boost — show confirmation
        const typeLabel = boostType === "spotlight" ? "🔥 Spotlighted" : boostType === "featured" ? "⭐ Featured" : "🚀 Boosted";
        toast.success(`Credits purchased! Your listing is now ${typeLabel}.`);
      } else {
        toast.success("Boost credits purchased successfully!");
      }

      // Clean URL then navigate
      window.history.replaceState({}, "", returnTo ?? "/host/boost");
      if (returnTo && returnTo !== pathname) {
        router.replace(decodeURIComponent(returnTo));
      }
      return;
    }

    // ── Payment cancelled ──────────────────────────────────────────────────
    if (params.get("payment_cancelled") === "1") {
      toast("Payment cancelled.", { icon: "ℹ️" });
      window.history.replaceState({}, "", pathname);
      return;
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
