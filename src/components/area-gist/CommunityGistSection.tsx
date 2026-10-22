"use client";

import React, { useState } from "react";
import { 
  Users, 
  ThumbsUp, 
  MapPin, 
  Calendar, 
  MessageSquarePlus, 
  ShieldCheck, 
  Filter, 
  Sparkles, 
  Check 
} from "lucide-react";
import { AreaGistData } from "./types";
import { API_BASE_URL } from "@/lib/api";

interface CommunityGistSectionProps {
  communityReports: AreaGistData["communityReports"];
  locationName: string;
  onOpenDropGist: () => void;
}

export function CommunityGistSection({
  communityReports,
  locationName,
  onOpenDropGist,
}: CommunityGistSectionProps) {
  const [corroborated, setCorroborated] = useState<Record<string, boolean>>({});
  const [corroborationCounts, setCorroborationCounts] = useState<Record<string, number>>({});
  const [filterCategory, setFilterCategory] = useState("All");

  const categories = [
    "All",
    ...Array.from(new Set(communityReports.map((c) => c.category).filter(Boolean))),
  ];

  const filteredReports = filterCategory === "All"
    ? communityReports
    : communityReports.filter((c) => c.category.toLowerCase() === filterCategory.toLowerCase());

  const handleCorroborate = async (id: string, currentCount: number) => {
    if (corroborated[id]) return; // already voted

    // Optimistic UI update
    setCorroborated((prev) => ({ ...prev, [id]: true }));
    setCorroborationCounts((prev) => ({
      ...prev,
      [id]: (prev[id] ?? currentCount) + 1,
    }));

    try {
      await fetch(`${API_BASE_URL}/v1/area-gist/community/${id}/corroborate`, {
        method: "POST",
      });
    } catch (err) {
      console.warn("Corroboration failed:", err);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Recently";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-NG", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <section id="community-gist" className="py-12 bg-gray-50/70 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-bt-primary mb-1.5">
              <Users className="w-3.5 h-3.5 text-bt-secondary" />
              Direct From Residents
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
              Community Gist: What Residents Say About {locationName}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1 max-w-2xl font-normal">
              First-hand reports from people who live and commute through these streets every day.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenDropGist}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-bt-primary hover:bg-bt-primary-light shadow-sm transition-all self-start sm:self-auto cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Drop Your Gist</span>
          </button>
        </div>

        {/* Filter Pills */}
        {categories.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-4 mb-2">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0 mr-1" />
            {categories.map((cat, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filterCategory === cat
                    ? "bg-bt-primary text-white shadow-xs"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Reports Grid */}
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-8 text-center max-w-lg mx-auto">
            <Users className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Be the First to Drop Gist on {locationName}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              Do you stay in or around {locationName}? Share your experience about power, water, or traffic to help incoming tenants.
            </p>
            <button
              type="button"
              onClick={onOpenDropGist}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-bt-primary hover:bg-bt-primary-light transition-colors cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4" /> Drop Gist Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReports.map((report) => {
              const count = corroborationCounts[report.id] ?? (report.corroborationsCount || 0);
              const hasVoted = !!corroborated[report.id];

              return (
                <div
                  key={report.id}
                  className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Category & Street */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-bt-primary/10 text-bt-primary border border-bt-primary/20">
                        {report.category}
                      </span>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(report.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-gray-800 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-bt-secondary shrink-0" />
                      <span className="truncate">{report.streetOrLandmark}</span>
                    </div>

                    {/* Gist narrative */}
                    <p className="text-sm text-gray-700 leading-relaxed font-normal mb-4">
                      "{report.gist}"
                    </p>
                  </div>

                  {/* Footer: Author & Corroboration button */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium truncate max-w-[150px]">
                      — {report.authorName || "Resident"}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCorroborate(report.id, report.corroborationsCount || 0)}
                      disabled={hasVoted}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        hasVoted
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-gray-50 hover:bg-bt-primary/10 text-gray-600 hover:text-bt-primary border border-gray-200"
                      }`}
                    >
                      {hasVoted ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Corroborated ({count})</span>
                        </>
                      ) : (
                        <>
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Can confirm ({count})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
