"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PropertyCard } from "@/components/property/property-card";
import { MOCK_PROPERTIES } from "@/lib/mock-data";
import { APARTMENT_TYPES, NIGERIAN_STATES, PRICE_RANGES } from "@/lib/constants";
import {
  SlidersHorizontal,
  X,
  MapPin,
  Home,
  DollarSign,
  Grid3X3,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";

function PropertiesContent() {
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const stateParam = searchParams.get("state") || "";
  const apartmentTypeParam = searchParams.get("apartmentType") || "";

  const [filters, setFilters] = useState({
    state: stateParam,
    apartmentType: apartmentTypeParam,
    minPrice: "",
    maxPrice: "",
  });

  const filteredProperties = MOCK_PROPERTIES.filter((p) => {
    if (p.type !== "rent") return false;
    if (filters.state && p.state !== filters.state) return false;
    if (filters.apartmentType && p.apartmentType !== filters.apartmentType)
      return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header / Filter Bar */}
      <div className="sticky top-[72px] lg:top-[78px] z-40 bg-white border-b border-neutral-200">
        <div className="max-w-[1360px] mx-auto px-5 lg:px-10 py-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-lg font-semibold text-neutral-900">
              Rental Properties
            </h1>

            <div className="flex items-center gap-2">
              {/* View toggle - desktop */}
              <div className="hidden sm:flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    viewMode === "grid"
                      ? "bg-white shadow-sm"
                      : "text-neutral-400"
                  )}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    viewMode === "list"
                      ? "bg-white shadow-sm"
                      : "text-neutral-400"
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Filter button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-colors",
                  showFilters
                    ? "bg-bt-primary text-white border-bt-primary"
                    : "bg-white text-neutral-700 border-neutral-200 hover:border-bt-primary/50"
                )}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Expandable Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 pb-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* State */}
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <select
                      value={filters.state}
                      onChange={(e) =>
                        setFilters({ ...filters, state: e.target.value })
                      }
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary"
                    >
                      <option value="">All States</option>
                      {NIGERIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Apartment type */}
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <select
                      value={filters.apartmentType}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          apartmentType: e.target.value,
                        })
                      }
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary"
                    >
                      <option value="">All Types</option>
                      {APARTMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price */}
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <select className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary">
                      <option value="">Any Budget</option>
                      {PRICE_RANGES.map((range) => (
                        <option
                          key={range.label}
                          value={`${range.min}-${range.max}`}
                        >
                          {range.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Clear */}
                  <button
                    onClick={() =>
                      setFilters({
                        state: "",
                        apartmentType: "",
                        minPrice: "",
                        maxPrice: "",
                      })
                    }
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Clear All
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-[1360px] mx-auto px-5 lg:px-10 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-neutral-500">
            <span className="font-semibold text-neutral-900">
              {filteredProperties.length}
            </span>{" "}
            properties found
          </p>
          <select className="text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white appearance-none cursor-pointer">
            <option>Most Relevant</option>
            <option>Newest First</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
          </select>
        </div>

        {filteredProperties.length > 0 ? (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center"
                : "space-y-4"
            )}
          >
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property._id}
                property={property}
                variant={viewMode === "list" ? "horizontal" : "default"}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Home className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No properties found
            </h3>
            <p className="text-neutral-500 mb-6">
              Try adjusting your filters to see more results
            </p>
            <button
              onClick={() =>
                setFilters({
                  state: "",
                  apartmentType: "",
                  minPrice: "",
                  maxPrice: "",
                })
              }
              className="px-6 py-3 rounded-full bg-bt-primary text-white font-medium"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-bt-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PropertiesContent />
    </Suspense>
  );
}
