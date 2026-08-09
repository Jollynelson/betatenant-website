"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
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

    try {
      const user = JSON.parse(decodeURIComponent(userRaw));
      setAuth(token, user);
      toast.success("Signed in successfully!");

      // Redirect to where they came from, or role-based default
      const from = sessionStorage.getItem("BT_LOGIN_FROM") || null;
      sessionStorage.removeItem("BT_LOGIN_FROM");

      if (from) {
        router.replace(from);
      } else if (user.role === "agent" || user.role === "landlord") {
        router.replace("/account/properties");
      } else {
        router.replace("/properties");
      }
    } catch {
      toast.error("Sign-in error. Please try again.");
      router.replace("/auth/login");
    }
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
