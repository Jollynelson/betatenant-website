"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Compass, 
  MapPin, 
  Share2, 
  ArrowLeftRight, 
  MessageSquarePlus,
  Building2,
  ListChecks,
  Users,
  Radio
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { AreaGistData } from "@/components/area-gist/types";
import { AreaSearch } from "@/components/area-gist/AreaSearch";
import { AreaGistHero } from "@/components/area-gist/AreaGistHero";
import { RentalRealitySection } from "@/components/area-gist/RentalRealitySection";
import { WhatIsHappeningFeed } from "@/components/area-gist/WhatIsHappeningFeed";
import { BeforeYouPayChecklist } from "@/components/area-gist/BeforeYouPayChecklist";
import { AreaListingsSection } from "@/components/area-gist/AreaListingsSection";
import { CommunityGistSection } from "@/components/area-gist/CommunityGistSection";
import { DropYourGistModal } from "@/components/area-gist/DropYourGistModal";
import { CompareAreasModal } from "@/components/area-gist/CompareAreasModal";
import { CompareSection } from "@/components/area-gist/CompareSection";
import { WhatsAppShareModal } from "@/components/area-gist/WhatsAppShareModal";

const ROTATING_TIPS = [
  "Checking if local gutters actually flow when it rains heavily...",
  "Consulting verified news sources, municipal records, and resident gist...",
  "Calculating median rent and cautionary fees across verified homes...",
  "Synthesizing peak hour traffic patterns and Third Mainland / express access...",
  "Checking transformer stability and water salinity reports...",
];

function AreaGistContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialLocation = searchParams.get("location") || "Yaba";
  const initialState = searchParams.get("state") || "Lagos";

  const [location, setLocation] = useState(initialLocation);
  const [state, setState] = useState(initialState);
  const [data, setData] = useState<AreaGistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tipIndex, setTipIndex] = useState(0);

  // Modals
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isDropGistOpen, setIsDropGistOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Cycle tips during loading
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % ROTATING_TIPS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [loading]);

  // Sync state with URL params
  useEffect(() => {
    const locParam = searchParams.get("location");
    const stParam = searchParams.get("state");
    if (locParam && locParam !== location) {
      setLocation(locParam);
    }
    if (stParam && stParam !== state) {
      setState(stParam);
    }
  }, [searchParams]);

  // Fetch Area Gist data
  const fetchAreaGist = async (targetLoc = location, targetSt = state) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE_URL}/v1/area-gist?location=${encodeURIComponent(targetLoc)}&state=${encodeURIComponent(targetSt)}`;
      const res = await fetch(url);
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        setData(json.data);
      } else {
        setError(json.message || "Failed to load neighbourhood intelligence.");
      }
    } catch (err: any) {
      console.error("Area Gist Fetch Error:", err);
      setError("Network error connecting to Beta Tenant intelligence server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreaGist(location, state);
  }, [location, state]);

  // Handle location selection from search bar
  const handleSelectLocation = (newLoc: string, newState: string) => {
    setLocation(newLoc);
    setState(newState);
    router.push(`/area-gist?location=${encodeURIComponent(newLoc)}&state=${encodeURIComponent(newState)}`);
  };

  return (
    <div className="min-h-screen bg-bt-surface text-gray-900 pb-20">
      {/* Top Banner / Header Search */}
      <div className="bg-white border-b border-gray-100 pt-8 pb-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-bt-secondary/10 text-bt-secondary mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              Area Gist by Beta Tenant
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-950 tracking-tight">
              Know the Area Before You Pay Caution Fee
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              Real-time, Google-grounded neighbourhood intelligence for Nigerian renters. Rent medians, NEPA stability, flood history, and honest resident gist.
            </p>
          </div>

          {/* Autocomplete Search Bar */}
          <AreaSearch
            currentLocation={location}
            currentState={state}
            onSelectLocation={handleSelectLocation}
            isLoading={loading}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto">
        {loading ? (
          /* Shimmer Loading State */
          <div className="py-20 px-4 sm:px-6 max-w-3xl mx-auto text-center space-y-6 animate-in fade-in duration-300">
            <div className="relative w-16 h-16 mx-auto">
              <div className="w-16 h-16 rounded-full border-4 border-bt-primary/10 border-t-bt-primary animate-spin" />
              <Compass className="w-6 h-6 text-bt-secondary absolute inset-0 m-auto animate-pulse" />
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                Investigating {location}, {state}...
              </h2>
              <p className="text-xs sm:text-sm text-bt-primary font-medium min-h-[24px] transition-all">
                {ROTATING_TIPS[tipIndex]}
              </p>
            </div>

            {/* Skeleton blocks */}
            <div className="space-y-4 pt-6">
              <div className="h-8 bg-gray-200/70 rounded-xl animate-pulse w-3/4 mx-auto" />
              <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        ) : error || !data ? (
          /* Error State */
          <div className="py-20 px-4 max-w-md mx-auto text-center">
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Could not load Area Gist
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-6 font-normal">
              {error || "An unexpected error occurred while synthesizing data."}
            </p>
            <button
              type="button"
              onClick={() => fetchAreaGist(location, state)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-bt-primary hover:bg-bt-primary-light transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
          </div>
        ) : (
          /* Live Intelligence Experience */
          <div>
            {/* Sticky Sub-nav Bar */}
            <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between overflow-x-auto no-scrollbar py-2 text-xs font-bold text-gray-600">
                <div className="flex items-center gap-1 sm:gap-4 shrink-0">
                  <a href="#hero" className="px-2.5 py-1.5 rounded-lg hover:text-bt-primary hover:bg-gray-100/80 transition-colors">
                    Overview
                  </a>
                  <a href="#rental-reality" className="px-2.5 py-1.5 rounded-lg hover:text-bt-primary hover:bg-gray-100/80 transition-colors">
                    Rental Reality
                  </a>
                  <a href="#what-is-happening" className="px-2.5 py-1.5 rounded-lg hover:text-bt-primary hover:bg-gray-100/80 transition-colors">
                    Recent Radar
                  </a>
                  <a href="#inspection-checklist" className="px-2.5 py-1.5 rounded-lg hover:text-bt-primary hover:bg-gray-100/80 transition-colors">
                    Inspection Checklist
                  </a>
                  <a href="#available-listings" className="px-2.5 py-1.5 rounded-lg hover:text-bt-primary hover:bg-gray-100/80 transition-colors flex items-center gap-1">
                    Homes <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-bt-primary/10 text-bt-primary font-extrabold">{data.stats.totalAvailableListings}</span>
                  </a>
                  <a href="#community-gist" className="px-2.5 py-1.5 rounded-lg hover:text-bt-primary hover:bg-gray-100/80 transition-colors">
                    Resident Gist
                  </a>
                </div>

                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCompareOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-bt-primary" /> Compare
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsShareOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                </div>
              </div>
            </div>

            {/* 1. Hero Overview */}
            <div id="hero">
              <AreaGistHero
                data={data}
                onOpenCompare={() => setIsCompareOpen(true)}
                onOpenDropGist={() => setIsDropGistOpen(true)}
                onOpenShare={() => setIsShareOpen(true)}
              />
            </div>

            {/* 2. Rental Reality Dimensions Grid */}
            <RentalRealitySection
              rentalReality={data.rentalReality}
              locationName={data.locationName}
            />

            {/* 3. What Is Happening Around Here Feed */}
            <WhatIsHappeningFeed
              recentIntelligence={data.recentIntelligence}
              locationName={data.locationName}
            />

            {/* 4. Physical Inspection Checklist */}
            <BeforeYouPayChecklist
              checklist={data.checklist}
              locationName={data.locationName}
              locationKey={data.locationKey}
            />

            {/* 5. Live Verified Beta Tenant Inventory */}
            <AreaListingsSection
              stats={data.stats}
              locationName={data.locationName}
              state={data.state}
            />

            {/* 6. Compare Section Call-To-Action */}
            <CompareSection
              currentLocation={data.locationName}
              currentState={data.state}
              onOpenCompare={() => setIsCompareOpen(true)}
            />

            {/* 7. Community Reports & Corroboration */}
            <CommunityGistSection
              communityReports={data.communityReports}
              locationName={data.locationName}
              onOpenDropGist={() => setIsDropGistOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      {data && (
        <>
          <CompareAreasModal
            isOpen={isCompareOpen}
            onClose={() => setIsCompareOpen(false)}
            currentArea={{ name: data.locationName, state: data.state }}
          />

          <DropYourGistModal
            isOpen={isDropGistOpen}
            onClose={() => setIsDropGistOpen(false)}
            locationName={data.locationName}
            state={data.state}
            onReportSubmitted={() => fetchAreaGist(location, state)}
          />

          <WhatsAppShareModal
            isOpen={isShareOpen}
            onClose={() => setIsShareOpen(false)}
            data={data}
          />
        </>
      )}
    </div>
  );
}

export default function AreaGistPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bt-surface">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-bt-primary mx-auto" />
            <p className="text-xs text-gray-500 font-medium">Loading Area Gist...</p>
          </div>
        </div>
      }
    >
      <AreaGistContent />
    </Suspense>
  );
}
