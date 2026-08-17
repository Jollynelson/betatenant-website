"use client";

import { use } from "react";

export default function ShortLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  // Redirect synchronously — backend serves OG tags for crawlers then redirects humans to property page
  if (typeof window !== "undefined") {
    window.location.replace(`https://api.betatenant.com/s/${code}`);
  }
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-neutral-500">Loading property…</p>
    </div>
  );
}
