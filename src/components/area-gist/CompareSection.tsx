"use client";

import React from "react";
import { ArrowLeftRight, Sparkles, Scale, CheckCircle2, ChevronRight } from "lucide-react";

interface CompareSectionProps {
  currentLocation: string;
  currentState: string;
  onOpenCompare: () => void;
}

const POPULAR_RIVALRIES = [
  { area1: "Yaba", area2: "Gbagada", state: "Lagos", hook: "Tech hub energy vs family quiet & mainland access" },
  { area1: "Lekki Phase 1", area2: "Ikoyi", state: "Lagos", hook: "Nightlife & dining vs old money calm & less flooding" },
  { area1: "Surulere", area2: "Ikeja", state: "Lagos", hook: "Central mainland charm vs commercial hub & GRA status" },
  { area1: "Ewet Housing", area2: "Shelter Afrique", state: "Akwa Ibom", hook: "Posh legacy estate vs high-profile diplomatic calm" },
];

export function CompareSection({
  currentLocation,
  currentState,
  onOpenCompare,
}: CompareSectionProps) {
  return (
    <section id="compare-section" className="py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-3xl bg-gradient-to-br from-bt-primary via-bt-primary-light to-bt-primary p-6 sm:p-10 text-white shadow-xl overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-bt-secondary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-bt-secondary-muted border border-white/15 mb-3">
                <Scale className="w-3.5 h-3.5 text-bt-secondary" />
                Head-to-Head Evaluation
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                Torn Between Two Neighbourhoods?
              </h2>
              <p className="text-sm sm:text-base text-gray-200 font-normal leading-relaxed mb-6">
                Don't guess where your rent will go further. Compare rent medians, flood risks, NEPA stability, and commute trade-offs side by side with AI-backed synthesis.
              </p>

              <button
                type="button"
                onClick={onOpenCompare}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-bt-primary bg-white hover:bg-gray-100 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4 text-bt-primary" />
                <span>Compare {currentLocation} vs Another Area</span>
              </button>
            </div>

            {/* Popular Matchup Pills */}
            <div className="w-full lg:max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-bt-secondary" /> Popular Comparisons
              </div>
              <div className="space-y-2">
                {POPULAR_RIVALRIES.map((rival, idx) => (
                  <div
                    key={idx}
                    onClick={onOpenCompare}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 transition-colors cursor-pointer group flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-white group-hover:text-bt-secondary-muted transition-colors flex items-center gap-2">
                        <span>{rival.area1}</span>
                        <span className="text-white/40">vs</span>
                        <span>{rival.area2}</span>
                        <span className="text-[10px] text-white/50 font-normal">({rival.state})</span>
                      </div>
                      <div className="text-[11px] text-white/70 mt-0.5 line-clamp-1">
                        {rival.hook}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
