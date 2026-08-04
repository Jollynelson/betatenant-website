"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import { NIGERIAN_STATES, APARTMENT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const popularSearches = [
  { label: "2 Bedroom in Lekki", state: "Lagos", type: "2 Bedroom" },
  { label: "Self Con in Yaba", state: "Lagos", type: "Self Contained" },
  { label: "Apartments in VI", state: "Lagos", type: "" },
  { label: "3 Bedroom in Ikeja", state: "Lagos", type: "3 Bedroom" },
  { label: "Apartments in Abuja", state: "FCT - Abuja", type: "" },
  { label: "Mini Flat in Surulere", state: "Lagos", type: "Mini Flat" },
];

const recentSearches = [
  "2 Bedroom in Lekki, Lagos",
  "Apartments in Victoria Island",
  "Self Contained Yaba",
];

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedState) params.set("state", selectedState);
    if (query) params.set("q", query);
    router.push(`/properties?${params.toString()}`);
  };

  const handleQuickSearch = (search: (typeof popularSearches)[0]) => {
    const params = new URLSearchParams();
    if (search.state) params.set("state", search.state);
    if (search.type) {
      params.set("apartmentType", search.type);
    }
    params.set("type", "rent");
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-20">
        {/* Search Input */}
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by location, apartment type..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border bg-white text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
            />
          </div>

          {/* State selector */}
          <div className="mt-4 flex flex-wrap gap-2">
            {["Lagos", "FCT - Abuja", "Rivers", "Ogun", "Oyo"].map(
              (state) => (
                <button
                  key={state}
                  type="button"
                  onClick={() =>
                    setSelectedState(selectedState === state ? "" : state)
                  }
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium border transition-colors",
                    selectedState === state
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white text-foreground border-border hover:border-primary/50"
                  )}
                >
                  <MapPin className="w-3.5 h-3.5 inline mr-1.5" />
                  {state}
                </button>
              )
            )}
          </div>
        </form>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4" />
              Recent Searches
            </h3>
            <div className="space-y-1">
              {recentSearches.map((search) => (
                <button
                  key={search}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors text-left"
                >
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground flex-1">
                    {search}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Popular Searches */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4" />
            Popular Searches
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {popularSearches.map((search, i) => (
              <motion.button
                key={search.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleQuickSearch(search)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {search.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Browse by State */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Browse by State
          </h3>
          <div className="flex flex-wrap gap-2">
            {NIGERIAN_STATES.slice(0, 12).map((state) => (
              <button
                key={state}
                onClick={() => {
                  router.push(
                    `/properties?state=${encodeURIComponent(state)}`
                  );
                }}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {state}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
