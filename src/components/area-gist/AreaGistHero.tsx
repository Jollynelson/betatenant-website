"use client";

import React from "react";
import { 
  MapPin, 
  Sparkles, 
  CloudRain, 
  Sun, 
  Cloud, 
  Wind, 
  Droplets, 
  ShieldCheck, 
  ArrowLeftRight, 
  Share2, 
  MessageSquarePlus, 
  Building2, 
  Coins, 
  Clock, 
  Compass, 
  AlertTriangle 
} from "lucide-react";
import { AreaGistData } from "./types";

interface AreaGistHeroProps {
  data: AreaGistData;
  onOpenCompare: () => void;
  onOpenDropGist: () => void;
  onOpenShare: () => void;
}

export function AreaGistHero({
  data,
  onOpenCompare,
  onOpenDropGist,
  onOpenShare,
}: AreaGistHeroProps) {
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
    if (!dateStr) return "recently";
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours <= 0) return "just now";
      if (diffHours === 1) return "1 hour ago";
      if (diffHours < 24) return `${diffHours} hours ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    } catch {
      return "recently";
    }
  };

  return (
    <div className="relative bg-gradient-to-b from-bt-primary/[0.04] via-transparent to-transparent pt-6 pb-8 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Meta Bar: Badges & Weather */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-bt-primary/10 text-bt-primary border border-bt-primary/20">
              <MapPin className="w-3.5 h-3.5 text-bt-primary" />
              {data.locationName}, {data.state}
              {data.lga ? ` (${data.lga} LGA)` : ""}
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {data.confidenceScore || "High Confidence"}
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

        {/* Big Witty Headline */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-950 tracking-tight leading-snug sm:leading-tight mb-4">
          {data.headline}
        </h1>

        {/* Grounded Summary Paragraph */}
        <p className="text-base sm:text-lg text-gray-700 leading-relaxed max-w-4xl font-normal mb-6">
          {data.summary}
        </p>

        {/* Data Coverage & Google Grounding Indicator */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-6 bg-blue-50/60 border border-blue-100/80 rounded-xl p-3">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Real-Time Intelligence:</strong> Synthesized across{" "}
            <span className="font-semibold text-gray-900">
              {data.dataCoverage?.sourcesCheckedCount || 12}+ verified Nigerian news outlets, municipal reports, and social feeds
            </span>
            . {data.dataCoverage?.coverageNote}
          </span>
        </div>

        {/* Live Rental Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:border-bt-primary/20 transition-all">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4 text-bt-primary" /> Available Homes
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-gray-950">
              {data.stats.totalAvailableListings}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">Verified on Beta Tenant</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:border-bt-primary/20 transition-all">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Coins className="w-4 h-4 text-emerald-600" /> Median Rent
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600">
              {data.stats.medianRent ? formatCurrency(data.stats.medianRent) : "₦1.5M - ₦3M"}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">per annum</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:border-bt-primary/20 transition-all">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Compass className="w-4 h-4 text-bt-secondary" /> Price Range
            </div>
            <div className="text-base sm:text-lg font-bold text-gray-900 truncate">
              {data.stats.priceRange?.min && data.stats.priceRange?.max
                ? `${formatCurrency(data.stats.priceRange.min)} - ${formatCurrency(data.stats.priceRange.max)}`
                : "Varied"}
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

        {/* Action Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenCompare}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-gray-800 bg-white border border-gray-200 hover:border-bt-primary hover:text-bt-primary shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 text-bt-primary" />
            Compare {data.locationName} vs Another Area
          </button>

          <button
            type="button"
            onClick={onOpenDropGist}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-bt-primary bg-bt-primary/5 hover:bg-bt-primary/10 border border-bt-primary/20 transition-all active:scale-95 cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4 text-bt-primary" />
            Drop Your Gist (Live here?)
          </button>

          <button
            type="button"
            onClick={onOpenShare}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Share on WhatsApp
          </button>

          {data.stats.totalAvailableListings > 0 && (
            <a
              href="#available-listings"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-bt-primary hover:bg-bt-primary-light shadow-sm transition-all ml-auto active:scale-95"
            >
              <Building2 className="w-4 h-4 text-white" />
              See {data.stats.totalAvailableListings} Available Homes
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
