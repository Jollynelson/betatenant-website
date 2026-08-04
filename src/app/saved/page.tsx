"use client";

import { motion } from "framer-motion";
import { Heart, Bell, Search } from "lucide-react";
import { PropertyCard } from "@/components/property/property-card";
import { MOCK_PROPERTIES } from "@/lib/mock-data";
import Link from "next/link";

export default function SavedPage() {
  const savedProperties = MOCK_PROPERTIES.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Saved Properties
            </h1>
            <p className="text-muted-foreground">
              {savedProperties.length} properties saved
            </p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
            <Bell className="w-4 h-4" />
            Set Alert
          </button>
        </div>

        {savedProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {savedProperties.map((property) => (
              <PropertyCard key={property._id} property={property} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No saved properties yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Start exploring and save properties you like. They&apos;ll appear here
              for easy access.
            </p>
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium"
            >
              <Search className="w-4 h-4" />
              Browse Properties
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
