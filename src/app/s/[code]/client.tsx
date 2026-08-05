"use client";

import { use, useEffect } from "react";

export default function ShortLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);

  useEffect(() => {
    window.location.href = `https://api.betatenant.com/s/${code}`;
  }, [code]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-neutral-500">Redirecting...</p>
    </div>
  );
}
