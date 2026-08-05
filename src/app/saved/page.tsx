"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Search, Loader2 } from "lucide-react";
import { PropertyCard } from "@/components/property/property-card";
import { getFavorites } from "@/lib/favorites";
import { propertyApi } from "@/lib/api";

function SavedContent() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = getFavorites();
    if (ids.length === 0) { setLoading(false); return; }
    Promise.allSettled(ids.map((id) => propertyApi.get(id).then((r) => r.property)))
      .then((results) => {
        setProperties(
          results
            .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled" && !!r.value)
            .map((r) => r.value)
        );
        setLoading(false);
      });
  }, []);

  const handleRemove = (id: string) => setProperties((p) => p.filter((x) => x._id !== id));

  return (
    <div className="min-h-screen bg-bt-surface">
      <div className="max-w-[1360px] mx-auto px-5 lg:px-10 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 tracking-[-0.02em]">Saved Properties</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {loading ? "Loading…" : `${properties.length} ${properties.length === 1 ? "property" : "properties"} saved`}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin text-bt-primary" />
          </div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {properties.map((p) => (
              <PropertyCard key={p._id} property={p} onRemove={handleRemove} />
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-7 h-7 text-neutral-300" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No saved properties yet</h3>
            <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto">
              Tap the heart on any listing to save it here for easy access later.
            </p>
            <Link href="/properties" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-bt-primary text-white font-semibold text-sm hover:bg-bt-primary-light transition-colors">
              <Search className="w-4 h-4" /> Browse Properties
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function SavedPage() {
  return <SavedContent />;
}
