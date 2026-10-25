"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Compass, 
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { AreaGistData } from "@/components/area-gist/types";
import { AreaSearch } from "@/components/area-gist/AreaSearch";
import { AreaGistHero } from "@/components/area-gist/AreaGistHero";
import { AreaQuickIntelCard } from "@/components/area-gist/AreaQuickIntelCard";
import { RentalRealitySection } from "@/components/area-gist/RentalRealitySection";
import { BeforeYouPayChecklist } from "@/components/area-gist/BeforeYouPayChecklist";
import { AreaListingsSection } from "@/components/area-gist/AreaListingsSection";
import { CommunityGistSection } from "@/components/area-gist/CommunityGistSection";
import { DropYourGistModal } from "@/components/area-gist/DropYourGistModal";
import { CompareAreasModal } from "@/components/area-gist/CompareAreasModal";
import { CompareSection } from "@/components/area-gist/CompareSection";
import { WhatsAppShareModal } from "@/components/area-gist/WhatsAppShareModal";

const ROTATING_TIPS = [
  "Checking verified local rent and caution fee standards...",
  "Synthesizing transport access and primary commuting corridors...",
  "Loading flood risk and drainage observations...",
  "Checking transformer stability and water reports...",
];

function AreaGistContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialLocation = searchParams.get("location") || "Uyo";
  const initialState = searchParams.get("state") || "Akwa Ibom";

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
      {/* Top Search Bar (Clean header matching Screenshot 0) */}
      <div className="bg-white border-b border-gray-100 py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
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
                Loading intelligence for {location}, {state}...
              </h2>
              <p className="text-xs sm:text-sm text-bt-primary font-medium min-h-[24px] transition-all">
                {ROTATING_TIPS[tipIndex]}
              </p>
            </div>

            {/* Skeleton blocks */}
            <div className="space-y-4 pt-6">
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
              {error || "An unexpected error occurred while loading preset intelligence."}
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
          /* Live Intelligence Experience (Matching Screenshots 0 through 6) */
          <div>
            {/* 1. Meta Badges, 4 Stat Cards & Action Buttons (Screenshot 0) */}
            <AreaGistHero
              data={data}
              onOpenCompare={() => setIsCompareOpen(true)}
              onOpenDropGist={() => setIsDropGistOpen(true)}
              onOpenShare={() => setIsShareOpen(true)}
            />

            {/* 2. Area Quick Intel: Rent Breakdown, Transit & Living Condition Meters (Screenshots 0 & 1) */}
            <AreaQuickIntelCard data={data} />

            {/* 3. The Street-Level Reality: Rental Reality Breakdown (Screenshot 2) */}
            <RentalRealitySection
              rentalReality={data.rentalReality}
              locationName={data.locationName}
            />

            {/* 4. Physical Inspection Guide: Before You Pay Checklist (Screenshot 3) */}
            <BeforeYouPayChecklist
              checklist={data.checklist}
              locationName={data.locationName}
              locationKey={data.locationKey}
            />

            {/* 5. Verified Homes For Rent in Location (Screenshot 4) */}
            <div id="available-listings">
              <AreaListingsSection
                stats={data.stats}
                locationName={data.locationName}
                state={data.state}
              />
            </div>

            {/* 6. Torn Between Two Neighbourhoods? Comparison Callout (Screenshot 5) */}
            <CompareSection
              currentLocation={data.locationName}
              currentState={data.state}
              onOpenCompare={() => setIsCompareOpen(true)}
            />

            {/* 7. Direct From Residents: Community Gist (Screenshots 5 & 6) */}
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
        <div className="min-h-screen bg-bt-surface flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-bt-primary" />
        </div>
      }
    >
      <AreaGistContent />
    </Suspense>
  );
}
