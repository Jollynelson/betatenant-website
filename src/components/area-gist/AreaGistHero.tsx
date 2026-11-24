"use client";

import React from "react";
import { 
  MapPin, 
  CloudRain, 
  Sun, 
  Cloud, 
  Droplets, 
  ShieldCheck, 
  Building2, 
  Coins, 
  Clock, 
  Compass, 
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import { AreaGistData } from "./types";

interface AreaGistHeroProps {
  data: AreaGistData;
  onOpenCompare?: () => void;
  onOpenDropGist?: () => void;
  onOpenShare?: () => void;
}

export function AreaGistHero({
  data,
}: AreaGistHeroProps) {
  const getConfidenceLabel = (score?: string) => {
    const raw = (score || "").toLowerCase();
    if (raw.includes("moderate")) return "Moderate Confidence Area";
    if (raw.includes("low")) return "Emerging Confidence Area";
    return "High Confidence Area";
  };
  const formatCurrency = (val: number) => {
    if (!val || val === 0) return "Not specified";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getWeatherIcon = (condition: string = "", rainAlert: boolean) => {
    if (rainAlert || condition.toLowerCase().includes("rain") || condition.toLowerCase().includes("shower")) {
      return <CloudRain className="w-4 h-4 text-blue-500 animate-pulse" />;
    }
    if (condition.toLowerCase().includes("cloud")) {
      return <Cloud className="w-4 h-4 text-sky-400" />;
    }
    return <Sun className="w-4 h-4 text-amber-500" />;
  };

  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return "just now";
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours <= 0) return "just now";
      if (diffHours === 1) return "1 hour ago";
      if (diffHours < 24) return `${diffHours} hours ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    } catch {
      return "just now";
    }
  };

  return (
    <div className="relative pt-4 pb-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Meta Bar: Badges & Weather (Matching Screenshot 0) */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-bt-primary/10 text-bt-primary border border-bt-primary/20">
              <MapPin className="w-3.5 h-3.5 text-bt-primary" />
              {data.locationName}, {data.state}
              {data.lga ? ` (${data.lga} LGA)` : ""}
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {getConfidenceLabel(data.confidenceScore)}
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-gray-500 bg-gray-100/80">
              <Clock className="w-3 h-3 text-gray-400" />
              Updated {timeAgo(data.dataCoverage?.lastSuccessfulResearchAt)}
            </span>
          </div>

          {/* Live Weather Pill */}
          {data.weather && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border shadow-xs transition-colors ${
              data.weather.rain_alert 
                ? "bg-amber-50/90 text-amber-900 border-amber-200" 
                : "bg-white text-gray-700 border-gray-200/80"
            }`}>
              {getWeatherIcon(data.weather.condition, data.weather.rain_alert)}
              <span className="font-bold text-gray-900">{Math.round(data.weather.temperature)}°C</span>
              <span className="text-gray-500 capitalize hidden sm:inline">{data.weather.condition}</span>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1 text-gray-500">
                <Droplets className="w-3 h-3 text-blue-400" /> {data.weather.humidity}%
              </span>
              {data.weather.rain_alert && (
                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white uppercase tracking-wider animate-pulse">
                  Flood Risk
                </span>
              )}
            </div>
          )}
        </div>

        {/* Live Rental Stats Grid (4 Cards) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <a
            href={data.stats.totalAvailableListings > 0 ? "#available-listings" : "/properties"}
            className="group block bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:border-bt-primary hover:shadow-md active:scale-[0.99] transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-bt-primary" /> Available Homes
              </span>
              <ChevronRight className="w-4 h-4 text-bt-primary opacity-70 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-gray-950 group-hover:text-bt-primary transition-colors">
              {data.stats.totalAvailableListings > 0 ? (
                data.stats.totalAvailableListings
              ) : (
                <span className="text-base sm:text-lg text-emerald-700 font-bold">New Zone</span>
              )}
            </div>
            <div className="text-[11px] text-bt-primary font-semibold mt-0.5">
              {data.stats.totalAvailableListings > 0 ? "Tap to view homes" : "Browse rental listings"}
            </div>
          </a>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:border-bt-primary/20 transition-all">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Coins className="w-4 h-4 text-emerald-600" /> Median Rent
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600">
              {data.stats.medianRent && data.stats.medianRent > 0
                ? formatCurrency(data.stats.medianRent)
                : data.rentBreakdown
                ? formatCurrency(
                    Math.round(
                      ((data.rentBreakdown.oneBedroom?.min ?? 600000) +
                        (data.rentBreakdown.oneBedroom?.max ?? 1200000) +
                        (data.rentBreakdown.twoBedroom?.min ?? 1200000) +
                        (data.rentBreakdown.twoBedroom?.max ?? 2500000)) / 4
                    )
                  )
                : "₦1,500,000"}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">per annum</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:border-bt-primary/20 transition-all">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Compass className="w-4 h-4 text-bt-secondary" /> Price Range
            </div>
            <div className="text-base sm:text-lg font-bold text-gray-900 truncate">
              {data.stats.priceRange?.min && data.stats.priceRange?.max && data.stats.priceRange.min > 0
                ? `${formatCurrency(data.stats.priceRange.min)} - ${formatCurrency(data.stats.priceRange.max)}`
                : data.rentBreakdown
                ? `${formatCurrency(data.rentBreakdown.selfContained?.min || data.rentBreakdown.oneBedroom?.min || 350000)} - ${formatCurrency(data.rentBreakdown.threeBedroomPlus?.max || data.rentBreakdown.twoBedroom?.max || 5000000)}`
                : "₦350,000 - ₦12,000,000"}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">Budget to Luxury</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:border-bt-primary/20 transition-all">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Key Watchpoint
            </div>
            <div className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2">
              {data.rentalReality?.find((r) => r.status === "High Alert" || r.status === "Challenging")?.dimension || "Commute & Peak Traffic"}
            </div>
            <div className="text-[11px] text-amber-600 mt-0.5">Investigate on inspection</div>
          </div>
        </div>
      </div>
    </div>
  );
}
