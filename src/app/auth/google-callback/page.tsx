"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { sanitizeRedirect } from "@/lib/utils";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { Suspense } from "react";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore(s => s.setAuth);

  useEffect(() => {
    const token = searchParams.get("token");
    const userRaw = searchParams.get("user");

    if (!token || !userRaw) {
      toast.error("Google sign-in failed. Please try again.");
      router.replace("/auth/login");
      return;
    }

    (async () => {
      try {
        const user = JSON.parse(decodeURIComponent(userRaw));
        setAuth(token, user);

        const isAgentOrLandlord = user.role === "agent" || user.role === "landlord";

        // Apply pending agency name if it was set before Google OAuth
        const pendingAgency = localStorage.getItem("BT_PENDING_AGENCY");
        if (isAgentOrLandlord && pendingAgency) {
          localStorage.removeItem("BT_PENDING_AGENCY");
          try {
            await api.put("/v1/user/profile", { agencyName: pendingAgency });
          } catch { /* non-critical */ }
        }

        toast.success("Signed in successfully!");

        // If agent/landlord signed up via Google and has no agency name → go to onboarding
        // (Only for new accounts — check if agencyName is blank)
        const googleRole = localStorage.getItem("BT_GOOGLE_ROLE");
        localStorage.removeItem("BT_GOOGLE_ROLE");

        const from = sanitizeRedirect(sessionStorage.getItem("BT_LOGIN_FROM"));
        sessionStorage.removeItem("BT_LOGIN_FROM");

        if (isAgentOrLandlord && !pendingAgency && !user.agencyName) {
          // New agent/landlord via Google — collect agency name
          router.replace("/onboarding/agency");
        } else if (from) {
          router.replace(from);
        } else if (isAgentOrLandlord) {
          router.replace("/account/properties");
        } else {
          router.replace("/properties");
        }
      } catch {
        toast.error("Sign-in error. Please try again.");
        router.replace("/auth/login");
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center bg-bt-surface">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-bt-primary mx-auto" />
        <p className="text-sm text-neutral-500">Completing sign-in...</p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-bt-primary" />
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}
