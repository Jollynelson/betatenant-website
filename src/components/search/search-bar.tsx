"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Home, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { NIGERIAN_STATES } from "@/lib/constants";

interface SearchBarProps {
  variant?: "hero" | "compact" | "page";
  className?: string;
}

export function SearchBar({ variant = "hero", className }: SearchBarProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"rent" | "short-let">("rent");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("type", activeTab);
    if (location) params.set("state", location);
    if (propertyType) params.set("apartmentType", propertyType);
    router.push(`/properties?${params.toString()}`);
  };

  if (variant === "compact") {
    return (
      <button
        onClick={() => router.push("/search")}
        className={cn(
          "flex items-center gap-3 w-full max-w-lg mx-auto px-5 py-3.5 rounded-full border border-border bg-white shadow-sm hover:shadow-md transition-shadow",
          className
        )}
      >
        <Search className="w-4.5 h-4.5 text-primary" />
        <span className="text-sm text-muted-foreground flex-1 text-left">
          Search by location, type...
        </span>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Search className="w-4 h-4 text-white" />
        </div>
      </button>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4">
        <button
          onClick={() => setActiveTab("rent")}
          className={cn(
            "px-5 py-2.5 rounded-full text-sm font-medium transition-all",
            activeTab === "rent"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-white/80 text-foreground hover:bg-white"
          )}
        >
          Rent
        </button>
        <button
          onClick={() => setActiveTab("short-let")}
          className={cn(
            "px-5 py-2.5 rounded-full text-sm font-medium transition-all",
            activeTab === "short-let"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-white/80 text-foreground hover:bg-white"
          )}
        >
          Short-Let
        </button>
      </div>

      {/* Search Form */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row items-stretch bg-white rounded-2xl sm:rounded-full shadow-xl border border-border/50 overflow-hidden"
      >
        {/* Location */}
        <div className="flex-1 flex items-center gap-3 px-5 py-4 border-b sm:border-b-0 sm:border-r border-border/50">
          <MapPin className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="text-xs font-medium text-muted-foreground block">
              Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-foreground focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">All States</option>
              {NIGERIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Property Type */}
        <div className="flex-1 flex items-center gap-3 px-5 py-4 border-b sm:border-b-0 sm:border-r border-border/50">
          <Home className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="text-xs font-medium text-muted-foreground block">
              Property Type
            </label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-foreground focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">Any Type</option>
              <option value="Self Contained">Self Contained</option>
              <option value="Mini Flat">Mini Flat</option>
              <option value="1 Bedroom">1 Bedroom</option>
              <option value="2 Bedroom">2 Bedroom</option>
              <option value="3 Bedroom">3 Bedroom</option>
              <option value="4 Bedroom">4 Bedroom</option>
              <option value="Duplex">Duplex</option>
            </select>
          </div>
        </div>

        {/* Budget - only on hero */}
        {variant === "hero" && (
          <div className="flex-1 flex items-center gap-3 px-5 py-4 border-b sm:border-b-0 sm:border-r border-border/50">
            <CalendarDays className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-muted-foreground block">
                Budget
              </label>
              <select className="w-full bg-transparent text-sm font-medium text-foreground focus:outline-none appearance-none cursor-pointer">
                <option value="">Any Budget</option>
                <option value="0-200000">Under ₦200k</option>
                <option value="200000-500000">₦200k - ₦500k</option>
                <option value="500000-1000000">₦500k - ₦1M</option>
                <option value="1000000-2000000">₦1M - ₦2M</option>
                <option value="2000000-5000000">₦2M - ₦5M</option>
                <option value="5000000-">Above ₦5M</option>
              </select>
            </div>
          </div>
        )}

        {/* Search Button */}
        <div className="p-2 sm:p-2.5 flex items-center">
          <button
            type="submit"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 rounded-xl sm:rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
          >
            <Search className="w-4.5 h-4.5" />
            <span className="sm:hidden lg:inline">Search</span>
          </button>
        </div>
      </form>
    </div>
  );
}
