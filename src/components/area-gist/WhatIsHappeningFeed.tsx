"use client";

import React, { useState } from "react";
import { 
  Radio, 
  ExternalLink, 
  Calendar, 
  Sparkles, 
  ShieldCheck, 
  Filter, 
  AlertCircle, 
  ArrowUpRight 
} from "lucide-react";
import { AreaGistData } from "./types";

interface WhatIsHappeningFeedProps {
  recentIntelligence: AreaGistData["recentIntelligence"];
  locationName: string;
}

export function WhatIsHappeningFeed({ recentIntelligence, locationName }: WhatIsHappeningFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = [
    "All",
    ...Array.from(new Set(recentIntelligence.map((item) => item.category).filter(Boolean))),
  ];

  const filteredItems = selectedCategory === "All"
    ? recentIntelligence
    : recentIntelligence.filter((item) => item.category.toLowerCase() === selectedCategory.toLowerCase());

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Recent update";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-NG", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section id="what-is-happening" className="py-10 bg-gray-50/70 border-y border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-bt-secondary mb-1.5">
              <Radio className="w-3.5 h-3.5 text-bt-secondary animate-pulse" />
              Live Radar & Municipal Updates
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
              What Is Happening Around {locationName}?
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1 max-w-2xl font-normal">
              Recent infrastructure projects, road closures, drainage cleanups, or local security advisories that could impact your daily commute and safety.
            </p>
          </div>

          {/* Filter Pills */}
          {categories.length > 2 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0 mr-1" />
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-bt-primary text-white shadow-xs"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Intelligence Feed Cards */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center max-w-lg mx-auto">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-1">
              No Major Disruptions Reported
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              Recent public reports and verified news indicate normal operational conditions in {locationName}. No emergency road repairs or active flood alerts at this time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {filteredItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Meta: Source publisher, Category, Date */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-bt-primary/10 text-bt-primary border border-bt-primary/20">
                        {item.sourceLabel || "Local Intelligence"}
                      </span>
                      {item.category && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700 capitalize">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(item.publishedAt)}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-extrabold text-base text-gray-950 mb-2 leading-snug group-hover:text-bt-primary transition-colors">
                    {item.title}
                  </h3>

                  {/* Grounded Summary */}
                  <p className="text-sm text-gray-700 leading-relaxed font-normal mb-4">
                    {item.summary}
                  </p>

                  {/* Renter Implication Box */}
                  {item.renterImplication && (
                    <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-3 mb-4">
                      <div className="text-[11px] font-bold text-sky-900 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                        <span>🎯</span> What this means for you
                      </div>
                      <div className="text-xs text-sky-950 font-medium leading-relaxed">
                        {item.renterImplication}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Source Link & Confidence */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {item.confidence || "Verified Source"}
                  </span>

                  {item.sourceUrl ? (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-bt-primary hover:text-bt-primary-light transition-colors group/link"
                    >
                      <span>Read Original Story</span>
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Direct Municipal Record</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
