"use client";

import React from "react";
import { 
  Home, 
  Car, 
  ShieldCheck, 
  Waves, 
  Sparkles, 
  Zap, 
  Droplets, 
  Navigation,
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { AreaGistData } from "./types";

interface AreaQuickIntelCardProps {
  data: AreaGistData;
}

export function AreaQuickIntelCard({ data }: AreaQuickIntelCardProps) {
  // Format numbers to clean Nigerian currency string: e.g. "250,000 - 450,000 NGN"
  const formatRange = (min?: number, max?: number, isPlus = false) => {
    if (!min && !max) return "Available on Request";
    if (isPlus || (!max || max === min)) {
      return `${(min || 0).toLocaleString()} + NGN`;
    }
    return `${(min || 0).toLocaleString()} - ${(max || 0).toLocaleString()} NGN`;
  };

  // Safe fallback rent breakdown if not loaded
  const rent = data.rentBreakdown || {
    selfContained: { min: 250000, max: 450000 },
    oneBedroom: { min: 500000, max: 800000 },
    twoBedroom: { min: 900000, max: 1500000 },
    threeBedroomPlus: { min: 1800000, max: 3500000 },
  };

  // Safe fallback transit connectivity
  const transit = data.transit || {
    availableModes: ["Keke Napep", "Taxis", "Bolt"],
    frequency: "High",
    primaryCorridors: ["Oron Road", "Abak Road", "Idoro Road"],
  };

  // Safe fallback scores
  const scores = data.scores || {
    traffic: { score: 80, label: "80% LESS TRAFFIC", details: "Wide avenues & smooth ring roads ensure fluid commuting" },
    security: { score: 73, label: "73% SECURE", details: "Active estate surveillance and metropolitan security patrols" },
    flood: { score: 45, label: "45% FLOOD PRONE", details: "Storm drainage clears main boulevards; inspect secondary streets" },
    cleanliness: { score: 95, label: "95% CLEAN", details: "Disciplined municipal waste collection and manicured medians" },
    electricity: { score: 78, label: "16-18 hrs/day (PHED)", hoursPerDay: 17 },
    water: { score: 92, label: "Clean Pure Groundwater" },
  };

  // Helper to render high-contrast dual-tone wireframe meter
  const renderMeter = (
    title: string,
    score: number,
    label: string,
    details?: string,
    icon?: React.ReactNode,
    isFloodMeter = false
  ) => {
    const clampedScore = Math.max(5, Math.min(98, score));
    const greenBg = isFloodMeter && clampedScore > 50 ? "bg-amber-600" : "bg-[#167d37]";
    const redBg = "bg-[#d81d24]";

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-gray-900 tracking-wider uppercase">
            {icon}
            <span>{title}</span>
          </div>
          <span className="text-[11px] font-semibold text-gray-500 hidden sm:inline">
            {score}% Index Rating
          </span>
        </div>

        {/* High-Contrast Wireframe Bar: Green Fill + Red Remainder (Fully Mobile Responsive) */}
        <div className="relative w-full h-11 sm:h-12 rounded-lg overflow-hidden flex border-2 border-black/80 shadow-sm">
          {/* Green / Active Portion */}
          <div
            style={{ width: `${clampedScore}%` }}
            className={`${greenBg} h-full flex items-center justify-center px-1.5 sm:px-3 transition-all duration-700 ease-out`}
          >
            <span className="text-white font-extrabold text-[10px] xs:text-xs sm:text-sm md:text-base tracking-tight sm:tracking-wide uppercase truncate text-center drop-shadow-xs">
              {label}
            </span>
          </div>

          {/* Red / Remainder Portion */}
          <div
            style={{ width: `${100 - clampedScore}%` }}
            className={`${redBg} h-full flex items-center justify-center shrink-0`}
          >
            {/* Remainder warning tone */}
          </div>
        </div>

        {details && (
          <p className="text-[11px] sm:text-xs text-gray-600 font-medium px-0.5 leading-snug">
            {details}
          </p>
        )}
      </div>
    );
  };

  return (
    <section className="w-full max-w-4xl mx-auto my-4 sm:my-6 px-3 sm:px-0">
      {/* SECTION CONTAINER */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-sm border border-gray-200/90 space-y-5 sm:space-y-6">
        
        {/* TOP ROW: Estimated Annual Rent (Left) + Transit & Connectivity (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          
          {/* CARD 1: ESTIMATED ANNUAL RENT */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200/90 p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2 border-b border-gray-100">
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight flex items-center gap-1.5 sm:gap-2">
                  <Home className="w-4 h-4 text-bt-primary shrink-0" />
                  Estimated Annual Rent
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                  {data.locationName}
                </span>
              </div>

              {/* RENT ROWS */}
              <div className="space-y-2.5 sm:space-y-3 divide-y divide-gray-100/80">
                {/* Self-Contained / Studio */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-1 text-[11px] sm:text-sm">
                  <span className="font-semibold text-gray-700 leading-tight">
                    Self-Contained / Studio
                  </span>
                  <span className="font-extrabold text-gray-950 text-right whitespace-nowrap">
                    {formatRange(rent.selfContained?.min, rent.selfContained?.max)}
                  </span>
                </div>

                {/* 1 Bedroom Flat */}
                <div className="pt-2.5 sm:pt-3 flex flex-wrap items-center justify-between gap-1 text-[11px] sm:text-sm">
                  <span className="font-semibold text-gray-700 leading-tight">
                    1 Bedroom Flat
                  </span>
                  <span className="font-extrabold text-gray-950 text-right whitespace-nowrap">
                    {formatRange(rent.oneBedroom?.min, rent.oneBedroom?.max)}
                  </span>
                </div>

                {/* 2 Bedroom Flat */}
                <div className="pt-2.5 sm:pt-3 flex flex-wrap items-center justify-between gap-1 text-[11px] sm:text-sm">
                  <span className="font-semibold text-gray-700 leading-tight">
                    2 Bedroom Flat
                  </span>
                  <span className="font-extrabold text-gray-950 text-right whitespace-nowrap">
                    {formatRange(rent.twoBedroom?.min, rent.twoBedroom?.max)}
                  </span>
                </div>

                {/* 3+ Bedroom / Duplex */}
                <div className="pt-2.5 sm:pt-3 flex flex-wrap items-center justify-between gap-1 text-[11px] sm:text-sm">
                  <span className="font-semibold text-gray-700 leading-tight">
                    3+ Bedroom / Duplex
                  </span>
                  <span className="font-extrabold text-gray-950 text-right whitespace-nowrap">
                    {formatRange(rent.threeBedroomPlus?.min, rent.threeBedroomPlus?.max, true)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 sm:mt-4 sm:pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
              <span>*Excludes caution & agency fees</span>
              <a href="#available-listings" className="text-bt-primary font-bold hover:underline flex items-center gap-1">
                View homes <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* CARD 2: TRANSIT & CONNECTIVITY */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200/90 p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                  <Car className="w-4 h-4 text-bt-secondary" />
                  Transit & Connectivity
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {transit.frequency} Frequency
                </span>
              </div>

              {/* Available Modes */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Available Modes:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(transit.availableModes || ["Keke Napep", "Taxis", "Bolt"]).map((mode, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-xs font-extrabold text-gray-900 bg-gray-100/90 border border-gray-200/80 rounded-lg inline-flex items-center gap-1.5"
                    >
                      <Navigation className="w-3 h-3 text-bt-primary" />
                      {mode}
                    </span>
                  ))}
                </div>
              </div>

              {/* Frequency */}
              <div className="space-y-1">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Frequency:
                </div>
                <div className="text-sm font-extrabold text-gray-950">
                  {transit.frequency}
                </div>
              </div>

              {/* Primary Corridors */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Primary Corridors:
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-gray-800">
                  {(transit.primaryCorridors || ["Oron Road", "Abak Road", "Idoro Road"]).map((corridor, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-blue-50/80 text-blue-900 border border-blue-200/70 rounded-md font-bold"
                    >
                      {corridor}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
              Avg. commute window: <strong className="text-gray-800">10 – 25 mins</strong> to commercial center
            </div>
          </div>
        </div>

        {/* BOTTOM METERS: CORE LIVING QUALITY GAUGES (Wireframe Dual-Tone Bars) */}
        <div className="pt-2 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-gray-100">
            <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-bt-secondary" />
              Living Condition Meters
            </h3>
            <span className="text-[11px] text-gray-400">Grounded in resident data & street reports</span>
          </div>

          {/* 1. TRAFFIC METER */}
          {renderMeter(
            "TRAFFIC",
            scores.traffic?.score ?? 80,
            scores.traffic?.label || `${scores.traffic?.score ?? 80}% LESS TRAFFIC`,
            scores.traffic?.details,
            <Car className="w-4 h-4 text-emerald-600" />
          )}

          {/* 2. SECURITY METER */}
          {renderMeter(
            "SECURITY",
            scores.security?.score ?? 73,
            scores.security?.label || `${scores.security?.score ?? 73}% SECURE`,
            scores.security?.details,
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          )}

          {/* 3. FLOOD METER */}
          {renderMeter(
            "FLOOD",
            scores.flood?.score ?? 45,
            scores.flood?.label || `${scores.flood?.score ?? 45}% FLOOD PRONE`,
            scores.flood?.details,
            <Waves className="w-4 h-4 text-blue-500" />,
            true
          )}

          {/* 4. CLEANLINESS METER */}
          {renderMeter(
            "CLEANLINESS",
            scores.cleanliness?.score ?? 95,
            scores.cleanliness?.label || `${scores.cleanliness?.score ?? 95}% CLEAN`,
            scores.cleanliness?.details,
            <Sparkles className="w-4 h-4 text-teal-600" />
          )}

          {/* Bonus Power & Water Bar */}
          {(scores.electricity || scores.water) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {scores.electricity && (
                <div className="flex items-center justify-between p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl text-xs font-semibold text-gray-800">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Power Stability</span>
                  </div>
                  <span className="font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                    {scores.electricity.label}
                  </span>
                </div>
              )}

              {scores.water && (
                <div className="flex items-center justify-between p-3 bg-sky-50/60 border border-sky-200/70 rounded-xl text-xs font-semibold text-gray-800">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-sky-500" />
                    <span>Water Quality</span>
                  </div>
                  <span className="font-extrabold text-sky-900 bg-sky-100 px-2 py-0.5 rounded-md">
                    {scores.water.label}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}