"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function SlugRedirectClient() {
  const [error, setError] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const slug = window.location.pathname.split("/in/")[1]?.split("/")[0];
        if (!slug) throw new Error("missing slug");
        const res = await fetch(`${API_BASE_URL}/v1/landlordandagent/share/slug/${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (!data?.successful || !data.shareId) throw new Error("profile not found");
        window.location.replace(`/agents/portfolio/${data.shareId}`);
      } catch {
        setError(true);
      }
    };
    run();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      {error ? (
        <p className="text-neutral-500">Profile not found.</p>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-bt-primary" />
          <p className="text-sm text-neutral-500">Opening profile…</p>
        </div>
      )}
    </div>
  );
}
