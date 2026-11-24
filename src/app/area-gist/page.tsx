"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

function AreaGistRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const qs = searchParams.toString();
    router.replace(`/area-check${qs ? `?${qs}` : ""}`);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-bt-surface flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-bt-primary" />
    </div>
  );
}

export default function AreaGistPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bt-surface flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-bt-primary" />
        </div>
      }
    >
      <AreaGistRedirect />
    </Suspense>
  );
}
