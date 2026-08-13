"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

// Google OAuth callback lands here (/login?code=...&iss=...) when the Google
// Console redirect URI hasn't been updated to /auth/google-callback yet.
// Forward all params back to the backend so it can exchange the code and
// redirect to /auth/google-callback?token=...&user=...
// If no code is present, redirect to the login page.
function LoginRedirect() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");

    if (code) {
      // Forward the OAuth callback to the backend — it will exchange the code
      // with Google and redirect back to /auth/google-callback?token=...
      const apiBase =
        window.location.hostname === "localhost"
          ? "/api/bt"
          : "https://api.betatenant.com";

      const params = new URLSearchParams();
      searchParams.forEach((v, k) => params.set(k, v));

      window.location.replace(
        `${apiBase}/v1/auth/login/federated/google?${params.toString()}`
      );
    } else {
      window.location.replace("/auth/login");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-bt-primary" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-bt-primary" />
        </div>
      }
    >
      <LoginRedirect />
    </Suspense>
  );
}
