"use client";

import React, { useState } from "react";
import { 
  BadgePercent, 
  Car, 
  CloudRain, 
  Zap, 
  Droplet, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  SearchCheck,
  AlertCircle
} from "lucide-react";
import { AreaGistData } from "./types";

interface RentalRealitySectionProps {
  rentalReality: AreaGistData["rentalReality"];
  locationName: string;
}

export function RentalRealitySection({ rentalReality, locationName }: RentalRealitySectionProps) {
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({});

  const toggleSource = (idx: number) => {
    setExpandedSources((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getDimensionIcon = (dim: string) => {
    const d = dim.toLowerCase();
    if (d.includes("rent") || d.includes("price") || d.includes("financial")) {
      return <BadgePercent className="w-5 h-5 text-emerald-600" />;
    }
    if (d.includes("commute") || d.includes("traffic") || d.includes("transport")) {
      return <Car className="w-5 h-5 text-bt-primary" />;
    }
    if (d.includes("drainage") || d.includes("flood") || d.includes("rain") || d.includes("erosion")) {
      return <CloudRain className="w-5 h-5 text-blue-600" />;
    }
    if (d.includes("light") || d.includes("power") || d.includes("electricity") || d.includes("nepa")) {
      return <Zap className="w-5 h-5 text-amber-500" />;
    }
    if (d.includes("water") || d.includes("borehole")) {
      return <Droplet className="w-5 h-5 text-sky-500" />;
    }
    if (d.includes("security") || d.includes("safety") || d.includes("crime")) {
      return <ShieldCheck className="w-5 h-5 text-indigo-600" />;
    }
    return <Sparkles className="w-5 h-5 text-bt-secondary" />;
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("favour") || s.includes("good") || s.includes("stable") || s.includes("high")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {status}
        </span>
      );
    }
    if (s.includes("fair") || s.includes("moderate") || s.includes("average")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <HelpCircle className="w-3 h-3 text-blue-500" /> {status}
        </span>
      );
    }
    if (s.includes("challenging") || s.includes("caution") || s.includes("moderate alert")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertCircle className="w-3 h-3 text-amber-600" /> {status}
        </span>
      );
    }
    // High alert / severe
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
        <ShieldAlert className="w-3 h-3 text-rose-600" /> {status}
      </span>
    );
  };

  return (
    <section id="rental-reality" className="py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-bt-primary mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-bt-secondary" />
              The Street-Level Reality
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
              Rental Reality Breakdown for {locationName}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1 max-w-2xl font-normal">
              Houses are easy to paint; neighbourhood realities are not. Here is what living here actually means for your daily routine, bills, and peace of mind.
            </p>
          </div>
          <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 shrink-0">
            Based on ground reports & verified data
          </div>
        </div>

        {/* 6 Dimensions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rentalReality.map((item, idx) => {
            const isSourceOpen = expandedSources[idx];
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-200/90 hover:border-bt-primary/30 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Dimension Name & Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-gray-50 group-hover:bg-bt-primary/5 transition-colors">
                        {getDimensionIcon(item.dimension)}
                      </div>
                      <h3 className="font-extrabold text-base text-gray-950">
                        {item.dimension}
                      </h3>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  {/* Findings */}
                  <div className="text-sm text-gray-700 leading-relaxed font-normal mb-4">
                    {item.findings}
                  </div>

                  {/* Renter Implication Callout */}
                  <div className="bg-amber-50/70 border-l-4 border-amber-500 rounded-r-xl p-3 mb-4">
                    <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                      <span>💡</span> Impact on Your Pocket & Routine
                    </div>
                    <div className="text-xs text-amber-950 font-medium leading-relaxed">
                      {item.renterImplication}
                    </div>
                  </div>

                  {/* Actionable Step for Physical Inspection */}
                  <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl p-3 mb-4">
                    <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                      <SearchCheck className="w-3.5 h-3.5 text-emerald-700" /> What to verify during inspection
                    </div>
                    <div className="text-xs text-emerald-950 font-medium leading-relaxed">
                      {item.actionableStep}
                    </div>
                  </div>
                </div>

                {/* Evidence & Sources Drawer */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium truncate max-w-[200px]" title={item.evidenceLabel}>
                      {item.evidenceLabel || "Verified research source"}
                    </span>
                    {item.sources && item.sources.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleSource(idx)}
                        className="inline-flex items-center gap-1 text-bt-primary hover:text-bt-primary-light font-bold cursor-pointer"
                      >
                        <span>{item.sources.length} {item.sources.length === 1 ? "source" : "sources"}</span>
                        {isSourceOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Sources List */}
                  {isSourceOpen && item.sources && item.sources.length > 0 && (
                    <div className="mt-2.5 space-y-1.5 pt-2 border-t border-dashed border-gray-200 animate-in fade-in duration-150">
                      {item.sources.map((src, sIdx) => (
                        <a
                          key={sIdx}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-50 hover:bg-bt-primary/5 text-gray-700 hover:text-bt-primary text-xs transition-colors group/src"
                        >
                          <span className="truncate font-medium">{src.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover/src:text-bt-primary shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
