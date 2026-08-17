"use client";

import { use } from "react";

export default function ProfileShortLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  // Redirect synchronously — backend resolves code and redirects to WhatsApp
  if (typeof window !== "undefined") {
    window.location.replace(`https://api.betatenant.com/m/${code}`);
  }
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-neutral-500">Opening WhatsApp…</p>
    </div>
  );
}
