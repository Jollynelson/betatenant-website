"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Plus, Eye, Loader2 } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { api, mapProperty } from "@/lib/api";
import { formatPriceFullNumber } from "@/lib/constants";

interface MappedProperty {
  _id: string;
  title: string;
  lga: string;
  state: string;
  price: number;
  photos: string[];
  status: string;
  views: number;
  type: string;
}

function AccountPropertiesContent() {
  const [properties, setProperties] = useState<MappedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .post<any>("/v1/landlordandagent/properties/1/50", {})
      .then((res) => {
        const raw: any[] = res?.properties ?? [];
        setProperties(raw.map(mapProperty));
      })
      .catch((err) => setError(err.message || "Failed to load properties."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-bt-surface">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">My Properties</h1>
            <p className="text-neutral-500 text-sm mt-0.5">All your listed properties</p>
          </div>
          <Link
            href="/host/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bt-primary text-white text-sm font-medium hover:bg-bt-primary-light transition-colors shadow-[0_2px_8px_rgba(10,8,118,0.2)]"
          >
            <Plus className="w-4 h-4" />
            New Listing
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-bt-primary" />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 rounded-2xl px-6 py-4 text-sm">{error}</div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 px-6 py-16 text-center">
            <Home className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
            <p className="text-neutral-600 font-medium mb-1">No listings yet</p>
            <p className="text-neutral-400 text-sm mb-6">Start by adding your first property.</p>
            <Link
              href="/host/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-bt-primary text-white text-sm font-semibold hover:bg-bt-primary-light transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Your First Listing
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {properties.map((p, i) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl border border-neutral-200 overflow-hidden flex gap-4 p-4 hover:shadow-sm transition-shadow"
              >
                {/* Thumbnail */}
                <div className="w-20 h-16 rounded-xl bg-neutral-100 overflow-hidden shrink-0">
                  {p.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photos[0]}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-6 h-6 text-neutral-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 truncate text-sm">{p.title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {p.lga}, {p.state}
                  </p>
                  <p className="text-sm font-bold text-bt-primary mt-1">
                    {formatPriceFullNumber(p.price)}
                    <span className="text-xs font-normal text-neutral-400">/yr</span>
                  </p>
                </div>

                {/* Right side */}
                <div className="flex flex-col items-end justify-between shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      p.status === "available"
                        ? "bg-emerald-50 text-emerald-700"
                        : p.status === "taken"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {p.status}
                  </span>
                  <div className="flex items-center gap-3 mt-2">
                    {p.views > 0 && (
                      <span className="flex items-center gap-1 text-xs text-neutral-400">
                        <Eye className="w-3.5 h-3.5" />
                        {p.views.toLocaleString()}
                      </span>
                    )}
                    <Link
                      href={`/property/${p._id}`}
                      className="text-xs font-medium text-bt-primary hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccountPropertiesPage() {
  return (
    <AuthGuard>
      <AccountPropertiesContent />
    </AuthGuard>
  );
}
