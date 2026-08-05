"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Home, Repeat2, Calendar, Loader2,
} from "lucide-react";
import { PropertyCard } from "@/components/property/property-card";
import { useAuthStore } from "@/lib/auth-store";
import { propertyApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const MOVE_FILTERS = [
  { label: "Anytime",  value: "" },
  { label: "1 Week",   value: "1w" },
  { label: "1 Month",  value: "1m" },
  { label: "2 Months", value: "2m" },
];

function TenantSwitchContent() {
  const { user } = useAuthStore();
  const isLoggedIn = !!user;
  const [moveFilter, setMoveFilter] = useState("");

  // Fetch tenant-only listings (userType=user filter matches live site)
  const { data, isLoading } = useQuery({
    queryKey: ["tenant-switch", moveFilter],
    queryFn: () => propertyApi.search({ page: 1, limit: 40 }),
    staleTime: 1000 * 60 * 2,
  });

  const allProperties = data?.properties ?? [];

  // Client-side move-in filter: filter by how recently the property was listed
  const properties = allProperties.filter((p: any) => {
    if (!moveFilter) return true;
    const days = moveFilter === "1w" ? 7 : moveFilter === "1m" ? 30 : moveFilter === "2m" ? 60 : null;
    if (!days || !p.createdAt) return true;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return new Date(p.createdAt) >= cutoff;
  });

  return (
    <div className="min-h-screen bg-bt-surface">
      {/* Hero */}
      <div className="bg-white border-b border-neutral-100 py-10 md:py-14">
        <div className="max-w-[720px] mx-auto px-5 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bt-primary/8 text-bt-primary text-sm font-semibold mb-5">
            <Repeat2 className="w-4 h-4" />
            Tenant Switch
          </div>
          <h1 className="text-[26px] sm:text-[32px] font-bold text-neutral-900 tracking-[-0.02em] mb-3">
            Find Tenants Ready to Swap
          </h1>
          <p className="text-neutral-500 leading-relaxed max-w-md mx-auto">
            Browse apartments listed by tenants who want to move. Find your next home and connect directly — no middlemen.
          </p>

          {/* CTA for logged-in tenants */}
          <div className="mt-6">
            {isLoggedIn ? (
              <Link
                href="/host/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-bt-primary text-white font-semibold text-sm hover:bg-bt-primary-light transition-colors shadow-[0_2px_8px_rgba(10,8,118,0.2)]"
              >
                <Home className="w-4 h-4" />
                List My Space
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-bt-primary text-white font-semibold text-sm hover:bg-bt-primary-light transition-colors"
                >
                  Sign in to list your space
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters + Listings */}
      <div className="max-w-[1360px] mx-auto px-5 lg:px-10 py-8">
        {/* Move-in date filter */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-neutral-500 mr-2">
            <Calendar className="w-4 h-4" />
            Move-in:
          </div>
          {MOVE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setMoveFilter(f.value)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium border transition-all",
                moveFilter === f.value
                  ? "bg-bt-primary text-white border-bt-primary"
                  : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[300px] rounded-xl bg-neutral-100 animate-pulse" />
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {properties.map((p: any) => (
              <PropertyCard key={p._id} property={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <Repeat2 className="w-7 h-7 text-neutral-300" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No swap listings right now</h3>
            <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto">
              Be the first to list your space and start a swap chain.
            </p>
            <Link
              href={isLoggedIn ? "/host/new" : "/auth/login"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-bt-primary text-white font-semibold text-sm hover:bg-bt-primary-light transition-colors"
            >
              <Home className="w-4 h-4" />
              List My Space
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TenantSwitchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-bt-primary" /></div>}>
      <TenantSwitchContent />
    </Suspense>
  );
}
