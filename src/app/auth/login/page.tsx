"use client";
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function Redirect() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const from = searchParams.get("from");
    window.location.replace(from ? `/login?from=${encodeURIComponent(from)}` : "/login");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function AuthLoginRedirect() {
  return <Suspense><Redirect /></Suspense>;
}
