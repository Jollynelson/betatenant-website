"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter as useNextRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { PropertyCard } from "@/components/property/property-card";
import { propertyApi, api } from "@/lib/api";
import { APARTMENT_TYPES, NIGERIAN_STATES, PRICE_RANGES } from "@/lib/constants";
import { locationData } from "@/lib/locations";
import {
  SlidersHorizontal, X, MapPin, Home, Grid3X3, List,
  ChevronDown, Check, ArrowDownUp, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollRestore } from "@/hooks/useScrollRestore";

type FilterPanel = "location" | "type" | "budget" | "filters" | "sort" | null;
type SortOption = "newest" | "price_asc" | "price_desc";

const SORT_LABELS: Record<SortOption, string> = {
  newest:     "Newest first",
  price_asc:  "Price: Low to high",
  price_desc: "Price: High to low",
};

const VM_KEY = "BT_PROP_VIEW";

function PropertiesContent() {
  const searchParams = useSearchParams();
  const urlRouter = useNextRouter();
  const [activePanel, setActivePanel] = useState<FilterPanel>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(() => Number(searchParams.get("page") || 1));
  const [sort, setSort] = useState<SortOption>((searchParams.get("sort") as SortOption) || "newest");
  const panelRef = useRef<HTMLDivElement>(null);
  // Compute initial bottom offset synchronously so the footer is correctly
  // positioned even before the first visualViewport resize event fires.
  const getBottomOffset = () =>
    typeof window !== "undefined" && window.visualViewport
      ? Math.max(0, window.screen.height - window.visualViewport.height - (window.visualViewport.offsetTop ?? 0))
      : 0;
  const [filterFooterPad, setFilterFooterPad] = useState(0);
  useScrollRestore("/properties");

  // Keep the "Show results" footer above the iOS Safari browser toolbar.
  useEffect(() => {
    // Set immediately on mount (covers the case where panel opens while toolbar is already showing)
    setFilterFooterPad(getBottomOffset());
    const vv = window.visualViewport;
    if (!vv) return;
    const sync = () => setFilterFooterPad(getBottomOffset());
    vv.addEventListener("resize", sync, { passive: true });
    window.addEventListener("orientationchange", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [filters, setFilters] = useState({
    state: searchParams.get("state") || "",
    lga:   searchParams.get("lga") || "",
    apartmentType: searchParams.get("apartmentType") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    amenities: [] as string[],
  });

  // Load amenities from API
  const { data: amenityData } = useQuery({
    queryKey: ["amenities-rent"],
    queryFn: () => api.get<any>("/v1/user/amenities/rent"),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
  const availableAmenities: { _id: string; name: string }[] = amenityData?.amenities ?? [];

  // Restore view mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(VM_KEY);
    if (saved === "list" || saved === "grid") setViewMode(saved);
  }, []);

  // Persist view mode to localStorage
  const handleSetViewMode = useCallback((mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem(VM_KEY, mode);
  }, []);

  // Sync filters + sort + page to URL so browser back/forward works
  const syncUrl = useCallback((newFilters: typeof filters, newSort: SortOption, newPage: number) => {
    const params = new URLSearchParams();
    if (newFilters.state)        params.set("state", newFilters.state);
    if (newFilters.lga)          params.set("lga", newFilters.lga);
    if (newFilters.apartmentType) params.set("apartmentType", newFilters.apartmentType);
    if (newFilters.minPrice)     params.set("minPrice", newFilters.minPrice);
    if (newFilters.maxPrice)     params.set("maxPrice", newFilters.maxPrice);
    if (newSort !== "newest")    params.set("sort", newSort);
    if (newPage > 1)             params.set("page", String(newPage));
    const qs = params.toString() ? `?${params.toString()}` : "";
    urlRouter.replace(`/properties${qs}`, { scroll: false });
    // Persist last search so mobile nav Browse tab restores it
    try {
      if (qs) {
        localStorage.setItem("BT_LAST_SEARCH", qs);
        sessionStorage.setItem("BT_LAST_SEARCH", qs);
      } else {
        localStorage.removeItem("BT_LAST_SEARCH");
        sessionStorage.removeItem("BT_LAST_SEARCH");
      }
    } catch {}
  }, [urlRouter]);

  const setFiltersAndSync = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
    syncUrl(newFilters, sort, 1);
  }, [sort, syncUrl]);

  const setSortAndSync = useCallback((newSort: SortOption) => {
    setSort(newSort);
    setPage(1);
    syncUrl(filters, newSort, 1);
  }, [filters, syncUrl]);

  const setPageAndSync = useCallback((newPage: number) => {
    setPage(newPage);
    syncUrl(filters, sort, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [filters, sort, syncUrl]);

  // When picking a state in location panel, show LGA step
  const [locationStep, setLocationStep] = useState<"state" | "lga">("state");

  // Close panel on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (window.innerWidth < 640) return; // mobile uses X button / footer to close
      if (panelRef.current && !panelRef.current.contains(e.target as Node))
        setActivePanel(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset location step when panel opens
  useEffect(() => {
    if (activePanel === "location") {
      setLocationStep(filters.state ? "lga" : "state");
    }
  }, [activePanel]); // eslint-disable-line react-hooks/exhaustive-deps

  const searchBody = {
    ...(filters.state ? { state: filters.state } : {}),
    ...(filters.lga ? { localGovernmentArea: filters.lga } : {}),
    ...(filters.apartmentType ? { apartmentTypes: [filters.apartmentType] } : {}),
    ...(filters.minPrice ? { minAmount: Number(filters.minPrice) } : {}),
    ...(filters.maxPrice ? { maxAmount: Number(filters.maxPrice) } : {}),
    ...(filters.amenities.length > 0 ? { amenities: filters.amenities } : {}),
    // Sort params
    ...(sort === "price_asc"  ? { sortBy: "listingFee", sortOrder: "asc" }  : {}),
    ...(sort === "price_desc" ? { sortBy: "listingFee", sortOrder: "desc" } : {}),
    page,
    limit: 12,
  };

  const hasFilters = !!(filters.state || filters.apartmentType || filters.minPrice || filters.maxPrice || filters.lga || filters.amenities.length > 0);
  const useSearch = hasFilters || sort !== "newest";

  type PropertyListResult = { properties: any[]; totalPages: number; totalDocs?: number; totalResults?: number; page: number };

  const { data, isLoading, isFetching, isError, refetch } = useQuery<PropertyListResult>({
    queryKey: ["properties", searchBody] as const,
    queryFn: () =>
      useSearch
        ? propertyApi.search(searchBody)
        : propertyApi.list(page, 12),
    staleTime: 1000 * 60 * 5,
    // Show previous results while new page loads (no blank screen between pages)
    placeholderData: (prev) => prev,
  });

  const properties = data?.properties ?? [];
  const totalPages = data?.totalPages ?? 1;

  const activeFilterCount = [
    filters.state, filters.lga, filters.apartmentType,
    filters.minPrice || filters.maxPrice,
    filters.amenities.length > 0 ? true : undefined,
  ].filter(Boolean).length;

  const togglePanel = (panel: FilterPanel) =>
    setActivePanel(activePanel === panel ? null : panel);

  const toggleAmenity = (a: string) => {
    const newAmenities = filters.amenities.includes(a)
      ? filters.amenities.filter((x) => x !== a)
      : [...filters.amenities, a];
    setFiltersAndSync({ ...filters, amenities: newAmenities });
  };

  // LGAs for selected state
  const selectedStateLGAs = locationData.find((d) => d.state === filters.state)?.cities ?? [];

  // Location pill label
  const locationLabel = filters.lga
    ? `${filters.state} · ${filters.lga}`
    : filters.state || "Location";

  return (
    <div className="min-h-screen bg-bt-surface">
      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-[72px] lg:top-[78px] z-40 bg-white border-b border-neutral-100" ref={panelRef}>
        <div className="max-w-[1360px] mx-auto px-4 lg:px-10">

          {/* ── Row 1: scrollable filter pills ── */}
          <div className="flex items-center gap-2 py-2.5 overflow-x-auto no-scrollbar">
            <FilterPill
              label={locationLabel}
              shortLabel={filters.lga || filters.state || undefined}
              active={activePanel === "location"}
              hasValue={!!(filters.state || filters.lga)}
              onClick={() => togglePanel("location")}
            />
            <FilterPill
              label={APARTMENT_TYPES.find((t) => t.value === filters.apartmentType)?.label || "Property type"}
              active={activePanel === "type"}
              hasValue={!!filters.apartmentType}
              onClick={() => togglePanel("type")}
            />
            <FilterPill
              label={filters.minPrice || filters.maxPrice
                ? `₦${Number(filters.minPrice || 0).toLocaleString()} – ₦${Number(filters.maxPrice || 10000000).toLocaleString()}`
                : "Budget"}
              active={activePanel === "budget"}
              hasValue={!!(filters.minPrice || filters.maxPrice)}
              onClick={() => togglePanel("budget")}
            />
            {/* Desktop: Filters + Sort + View toggle in same row */}
            <div className="hidden sm:flex items-center gap-2 ml-auto shrink-0">
              <button
                onClick={() => togglePanel("filters")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border transition-all",
                  activePanel === "filters" ? "bg-neutral-900 text-white border-neutral-900"
                    : activeFilterCount > 0 ? "bg-bt-primary/5 border-bt-primary/30 text-bt-primary"
                    : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300"
                )}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-bt-secondary text-white text-[11px] font-bold flex items-center justify-center">{activeFilterCount}</span>
                )}
              </button>
              <button
                onClick={() => togglePanel("sort")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border transition-all",
                  activePanel === "sort" ? "bg-neutral-900 text-white border-neutral-900"
                    : sort !== "newest" ? "bg-bt-primary/5 border-bt-primary/30 text-bt-primary"
                    : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300"
                )}
              >
                <ArrowDownUp className="w-3.5 h-3.5" />
                {SORT_LABELS[sort]}
              </button>
              <div className="flex items-center gap-0.5 p-1 bg-neutral-100 rounded-lg">
                <button onClick={() => handleSetViewMode("grid")} className={cn("p-1.5 rounded-md transition-all", viewMode === "grid" ? "bg-white shadow-sm text-neutral-900" : "text-neutral-400 hover:text-neutral-600")}>
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button onClick={() => handleSetViewMode("list")} className={cn("p-1.5 rounded-md transition-all", viewMode === "list" ? "bg-white shadow-sm text-neutral-900" : "text-neutral-400 hover:text-neutral-600")}>
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Row 2: mobile-only — always visible Filters + Sort ── */}
          <div className="sm:hidden flex items-center gap-2 pb-2.5">
            <button
              onClick={() => togglePanel("filters")}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold border transition-all",
                activePanel === "filters" ? "bg-neutral-900 text-white border-neutral-900"
                  : activeFilterCount > 0 ? "bg-bt-primary text-white border-bt-primary"
                  : "bg-white border-neutral-200 text-neutral-700"
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-bt-primary text-[11px] font-bold flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
            <button
              onClick={() => togglePanel("sort")}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold border transition-all",
                activePanel === "sort" ? "bg-neutral-900 text-white border-neutral-900"
                  : sort !== "newest" ? "bg-bt-primary/5 border-bt-primary/30 text-bt-primary"
                  : "bg-white border-neutral-200 text-neutral-700"
              )}
            >
              <ArrowDownUp className="w-4 h-4" />
              {sort === "newest" ? "Sort" : sort === "price_asc" ? "Price ↑" : "Price ↓"}
            </button>
            <div className="flex items-center gap-0.5 p-1 bg-neutral-100 rounded-lg shrink-0">
              <button onClick={() => handleSetViewMode("grid")} className={cn("p-1.5 rounded-md transition-all", viewMode === "grid" ? "bg-white shadow-sm text-neutral-900" : "text-neutral-400")}>
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button onClick={() => handleSetViewMode("list")} className={cn("p-1.5 rounded-md transition-all", viewMode === "list" ? "bg-white shadow-sm text-neutral-900" : "text-neutral-400")}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Filter panels ── */}
        <AnimatePresence>
          {activePanel && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[60] bg-white flex flex-col sm:absolute sm:inset-auto sm:left-0 sm:right-0 sm:z-30 sm:block sm:border-b sm:border-neutral-200 sm:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.1)]"
            >
              {/* Mobile-only header */}
              <div className="sm:hidden shrink-0 flex items-center justify-between px-5 py-4 border-b border-neutral-100">
                <h2 className="text-base font-bold text-neutral-900">
                  {activePanel === "sort" ? "Sort by"
                    : activePanel === "location" ? "Location"
                    : activePanel === "type" ? "Property type"
                    : activePanel === "budget" ? "Budget"
                    : "Filters"}
                </h2>
                <button
                  onClick={() => setActivePanel(null)}
                  className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-neutral-600" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto sm:overflow-visible sm:flex-none">
              <div className="max-w-[1360px] mx-auto px-5 lg:px-10 py-5">

                {/* ── Sort ── */}
                {activePanel === "sort" && (
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 mb-3">Sort by</h3>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {(["newest", "price_asc", "price_desc"] as SortOption[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => { setSortAndSync(s); setActivePanel(null); }}
                          className={cn(
                            "flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm text-left transition-all",
                            sort === s
                              ? "bg-bt-primary/8 border border-bt-primary/30 text-bt-primary font-semibold"
                              : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                          )}
                        >
                          <ArrowDownUp className="w-4 h-4 shrink-0 opacity-50" />
                          {SORT_LABELS[s]}
                          {sort === s && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Location: State → LGA drill-down ── */}
                {activePanel === "location" && (
                  <div>
                    {locationStep === "state" ? (
                      <>
                        <h3 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-bt-primary" /> Select State
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 max-h-[260px] sm:max-h-none overflow-y-auto">
                          {/* All Nigeria option */}
                          <button
                            onClick={() => {
                              setFiltersAndSync({ ...filters, state: "", lga: "" });
                              setActivePanel(null);
                            }}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition-all col-span-2 sm:col-span-1",
                              !filters.state
                                ? "bg-bt-primary/8 border border-bt-primary/30 text-bt-primary font-medium"
                                : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                            )}
                          >
                            <span className="truncate flex-1">🇳🇬 All Nigeria</span>
                            {!filters.state && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
                          </button>
                          {NIGERIAN_STATES.map((state) => (
                            <button
                              key={state}
                              onClick={() => {
                                setFiltersAndSync({ ...filters, state, lga: "" });
                                setLocationStep("lga");
                              }}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition-all",
                                filters.state === state
                                  ? "bg-bt-primary/8 border border-bt-primary/30 text-bt-primary font-medium"
                                  : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                              )}
                            >
                              <span className="truncate flex-1">{state}</span>
                              {filters.state === state && <ChevronDown className="w-3.5 h-3.5 -rotate-90 shrink-0" />}
                            </button>
                          ))}
                        </div>
                        <PanelFooter count={properties.length} loading={isFetching}
                          onClear={() => { setFiltersAndSync({ ...filters, state: "", lga: "" }); setLocationStep("state"); }}
                          onApply={() => setActivePanel(null)} />
                      </>
                    ) : (
                      <>
                        {/* LGA step */}
                        <div className="flex items-center gap-2 mb-4">
                          <button
                            onClick={() => setLocationStep("state")}
                            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors shrink-0"
                          >
                            <ArrowLeft className="w-4 h-4 text-neutral-600" />
                          </button>
                          <h3 className="text-base font-bold text-neutral-900">
                            <span className="text-bt-primary">{filters.state}</span>
                            <span className="text-neutral-400 font-normal"> · Select city / LGA</span>
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 max-h-[260px] sm:max-h-none overflow-y-auto">
                          {/* All [State] option — auto-closes */}
                          <button
                            onClick={() => {
                              setFiltersAndSync({ ...filters, lga: "" });
                              setActivePanel(null);
                            }}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition-all",
                              !filters.lga
                                ? "bg-bt-primary/8 border border-bt-primary/30 text-bt-primary font-medium"
                                : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                            )}
                          >
                            <span className="truncate flex-1">All {filters.state}</span>
                            {!filters.lga && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
                          </button>
                          {selectedStateLGAs.map((lga) => (
                            <button
                              key={lga}
                              onClick={() => {
                                setFiltersAndSync({ ...filters, lga: filters.lga === lga ? "" : lga });
                                setActivePanel(null); // auto-close on selection
                              }}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition-all",
                                filters.lga === lga
                                  ? "bg-bt-primary/8 border border-bt-primary/30 text-bt-primary font-medium"
                                  : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                              )}
                            >
                              <MapPin className="w-3 h-3 shrink-0 opacity-40" />
                              <span className="truncate flex-1">{lga}</span>
                              {filters.lga === lga && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
                            </button>
                          ))}
                        </div>
                        <PanelFooter count={properties.length} loading={isFetching}
                          onClear={() => { setFiltersAndSync({ ...filters, state: "", lga: "" }); setLocationStep("state"); }}
                          onApply={() => setActivePanel(null)} />
                      </>
                    )}
                  </div>
                )}

                {/* ── Property type ── */}
                {activePanel === "type" && (
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 mb-4">Property type</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {APARTMENT_TYPES.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => {
                            setFiltersAndSync({ ...filters, apartmentType: filters.apartmentType === type.value ? "" : type.value });
                            setActivePanel(null); // auto-close on mobile
                          }}
                          className={cn(
                            "flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm text-left transition-all",
                            filters.apartmentType === type.value
                              ? "bg-bt-primary/8 border border-bt-primary/30 text-bt-primary font-medium"
                              : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                          )}
                        >
                          <Home className="w-4 h-4 shrink-0 opacity-50" />
                          <span>{type.label}</span>
                          {filters.apartmentType === type.value && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
                        </button>
                      ))}
                    </div>
                    <PanelFooter count={properties.length} loading={isFetching}
                      onClear={() => setFiltersAndSync({ ...filters, apartmentType: "" })}
                      onApply={() => setActivePanel(null)} />
                  </div>
                )}

                {/* ── Budget ── */}
                {activePanel === "budget" && (
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 mb-4">Budget <span className="text-sm font-normal text-neutral-500">per year</span></h3>
                    <div className="flex items-center gap-4 max-w-md mb-5">
                      <div className="flex-1">
                        <label className="text-xs text-neutral-400 uppercase tracking-wide mb-1.5 block">From</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-neutral-400">₦</span>
                          <input type="text" value={filters.minPrice ? Number(filters.minPrice).toLocaleString() : ""}
                            onChange={(e) => setFiltersAndSync({ ...filters, minPrice: e.target.value.replace(/[^0-9]/g, "") })}
                            placeholder="0"
                            className="w-full pl-8 pr-4 py-3 rounded-xl border border-neutral-200 text-[16px] font-medium focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all"
                          />
                        </div>
                      </div>
                      <span className="text-neutral-300 mt-5">—</span>
                      <div className="flex-1">
                        <label className="text-xs text-neutral-400 uppercase tracking-wide mb-1.5 block">To</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-neutral-400">₦</span>
                          <input type="text" value={filters.maxPrice ? Number(filters.maxPrice).toLocaleString() : ""}
                            onChange={(e) => setFiltersAndSync({ ...filters, maxPrice: e.target.value.replace(/[^0-9]/g, "") })}
                            placeholder="Any"
                            className="w-full pl-8 pr-4 py-3 rounded-xl border border-neutral-200 text-[16px] font-medium focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {PRICE_RANGES.map((r) => (
                        <button key={r.label}
                          onClick={() => setFiltersAndSync({ ...filters, minPrice: String(r.min), maxPrice: String(r.max) })}
                          className={cn(
                            "px-3.5 py-2 rounded-lg text-xs font-medium border transition-all",
                            filters.minPrice === String(r.min) && filters.maxPrice === String(r.max)
                              ? "bg-bt-primary/8 border-bt-primary/30 text-bt-primary"
                              : "bg-neutral-50 border-transparent text-neutral-600 hover:bg-neutral-100"
                          )}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                    <PanelFooter count={properties.length} loading={isFetching}
                      onClear={() => setFiltersAndSync({ ...filters, minPrice: "", maxPrice: "" })}
                      onApply={() => setActivePanel(null)} />
                  </div>
                )}

                {/* ── More Filters ── */}
                {activePanel === "filters" && (
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 mb-4">Features &amp; Amenities</h3>
                    {availableAmenities.length === 0 ? (
                      <p className="text-sm text-neutral-400 py-2">Loading amenities...</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                        {availableAmenities.map((a) => (
                          <label key={a._id} className={cn("flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg cursor-pointer text-sm transition-all", filters.amenities.includes(a.name) ? "bg-bt-primary/8 text-bt-primary font-medium" : "text-neutral-600 hover:bg-neutral-50")}>
                            <input type="checkbox" checked={filters.amenities.includes(a.name)} onChange={() => toggleAmenity(a.name)} className="w-4 h-4 rounded border-neutral-300 accent-bt-primary" />
                            {a.name}
                          </label>
                        ))}
                      </div>
                    )}
                    <PanelFooter count={properties.length} loading={isFetching}
                      onClear={() => setFiltersAndSync({ ...filters, amenities: [] })}
                      onApply={() => setActivePanel(null)} />
                  </div>
                )}
              </div>
              </div>{/* end scrollable */}

              {/* Mobile-only sticky footer — replaces bottom nav */}
              <div
                className="sm:hidden shrink-0 px-5 pt-3 border-t border-neutral-100 bg-white"
                style={{ paddingBottom: `${Math.max(16, filterFooterPad || getBottomOffset())}px` }}
              >
                <div className="flex items-center gap-3 py-1">
                  <button
                    onClick={() => {
                      if (activePanel === "sort") setSortAndSync("newest");
                      else if (activePanel === "location") { setFiltersAndSync({ ...filters, state: "", lga: "" }); setLocationStep("state"); }
                      else if (activePanel === "type") setFiltersAndSync({ ...filters, apartmentType: "" });
                      else if (activePanel === "budget") setFiltersAndSync({ ...filters, minPrice: "", maxPrice: "" });
                      else if (activePanel === "filters") setFiltersAndSync({ ...filters, amenities: [] });
                    }}
                    className="text-sm font-semibold text-neutral-500 underline underline-offset-2 whitespace-nowrap"
                  >
                    Clear all
                  </button>
                  <button
                    onClick={() => setActivePanel(null)}
                    className="flex-1 py-3.5 rounded-full bg-bt-primary text-white text-sm font-bold text-center"
                  >
                    {isFetching
                      ? "Loading..."
                      : `Show ${(data?.totalResults ?? data?.totalDocs ?? properties.length).toLocaleString()} results`}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      <div className="max-w-[1360px] mx-auto px-4 lg:px-10 py-5 md:py-8">
        {/* Active filter tags */}
        {(activeFilterCount > 0 || sort !== "newest") && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {filters.state && (
              <ActiveTag
                label={filters.lga ? `${filters.state} · ${filters.lga}` : filters.state}
                onRemove={() => setFiltersAndSync({ ...filters, state: "", lga: "" })}
              />
            )}
            {filters.apartmentType && <ActiveTag label={APARTMENT_TYPES.find((t) => t.value === filters.apartmentType)?.label || filters.apartmentType} onRemove={() => setFiltersAndSync({ ...filters, apartmentType: "" })} />}
            {(filters.minPrice || filters.maxPrice) && <ActiveTag label={`₦${Number(filters.minPrice || 0).toLocaleString()} – ₦${Number(filters.maxPrice || 10000000).toLocaleString()}`} onRemove={() => setFiltersAndSync({ ...filters, minPrice: "", maxPrice: "" })} />}
            {sort !== "newest" && <ActiveTag label={SORT_LABELS[sort]} onRemove={() => setSortAndSync("newest")} />}
            <button onClick={() => { setFiltersAndSync({ state: "", lga: "", apartmentType: "", minPrice: "", maxPrice: "", amenities: [] }); setSortAndSync("newest"); }} className="text-xs font-medium text-neutral-500 hover:text-neutral-800 underline underline-offset-2">
              Clear all
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-neutral-500 flex items-center gap-2">
            {isLoading && !data ? "Loading..." : isError ? "Error loading results" : (
              <><span className="font-semibold text-neutral-900">{(data?.totalResults ?? data?.totalDocs ?? properties.length).toLocaleString()}</span> properties{filters.state && <span className="text-neutral-400"> in {filters.lga || filters.state}</span>}</>
            )}
            {/* Subtle background-fetch indicator — doesn't block the UI */}
            {isFetching && data && (
              <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-bt-primary/30 border-t-bt-primary animate-spin" />
            )}
          </p>
        </div>

        {/* Only show skeleton on TRUE first load (no cached data) */}
        {isLoading && !data ? (
          <div className={cn(viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5" : "space-y-3")}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-neutral-100 animate-pulse h-[320px]" />
            ))}
          </div>
        ) : properties.length > 0 ? (
          <>
            {/* Spotlight listings — shown first, full-width prominence */}
            {(properties as any[]).some((p: any) => p.promotionPackage === "spotlight") && (
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-bold text-[#FF4500] uppercase tracking-wider">🔥 Spotlight</span>
                  <div className="flex-1 h-px bg-[#FF4500]/15" />
                </div>
                <div className={cn(viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5" : "space-y-3")}>
                  {(properties as any[]).filter((p: any) => p.promotionPackage === "spotlight").map((p) => (
                    <PropertyCard key={`sp-${p._id}`} property={p} variant={viewMode === "list" ? "horizontal" : "default"} />
                  ))}
                </div>
                <div className="h-px bg-neutral-100 mt-5 mb-5" />
              </div>
            )}
            <div className={cn(viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5" : "space-y-3")}>
              {/* Exclude spotlight from main grid (shown above) */}
              {(properties as any[]).filter((p: any) => p.promotionPackage !== "spotlight").map((p) => (
                <PropertyCard key={p._id} property={p} variant={viewMode === "list" ? "horizontal" : "default"} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button onClick={() => setPageAndSync(Math.max(1, page - 1))} disabled={page === 1}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-neutral-200 disabled:opacity-40 hover:bg-neutral-50 transition-colors">
                  Previous
                </button>
                <span className="text-sm text-neutral-500 px-3">Page {page} of {totalPages}</span>
                <button onClick={() => setPageAndSync(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-neutral-200 disabled:opacity-40 hover:bg-neutral-50 transition-colors">
                  Next
                </button>
              </div>
            )}
          </>
        ) : isError ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Home className="w-7 h-7 text-red-300" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Could not load properties</h3>
            <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto">Check your connection and try again</p>
            <button onClick={() => refetch()} className="px-6 py-3 rounded-full bg-bt-primary text-white text-sm font-semibold hover:bg-bt-primary-light transition-colors">Retry</button>
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <Home className="w-7 h-7 text-neutral-300" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No properties found</h3>
            <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto">Try adjusting your filters or searching in a different location</p>
            <button onClick={() => { setFiltersAndSync({ state: "", lga: "", apartmentType: "", minPrice: "", maxPrice: "", amenities: [] }); setSortAndSync("newest"); }}
              className="px-6 py-3 rounded-full bg-bt-primary text-white text-sm font-semibold hover:bg-bt-primary-light transition-colors">
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterPill({ label, shortLabel, active, hasValue, onClick }: {
  label: string; shortLabel?: string; active: boolean; hasValue: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap",
        active ? "bg-neutral-900 text-white border-neutral-900" :
          hasValue ? "bg-bt-primary/5 border-bt-primary/30 text-bt-primary" :
            "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300"
      )}
    >
      {shortLabel ? (
        <>
          <span className="sm:hidden max-w-[120px] truncate">{shortLabel}</span>
          <span className="hidden sm:inline max-w-[140px] truncate">{label}</span>
        </>
      ) : (
        <span className="max-w-[140px] truncate">{label}</span>
      )}
      <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 transition-transform", active && "rotate-180")} />
    </button>
  );
}

function PanelFooter({ count, loading, onClear, onApply }: { count: number; loading?: boolean; onClear: () => void; onApply: () => void }) {
  return (
    <div className="hidden sm:flex items-center justify-between mt-5 pt-4 border-t border-neutral-100">
      <button onClick={onClear} className="text-sm font-medium text-neutral-500 hover:text-neutral-800 underline underline-offset-2">Clear</button>
      <button onClick={onApply} className="px-6 py-2.5 rounded-full bg-bt-primary text-white text-sm font-semibold hover:bg-bt-primary-light transition-colors">
        {loading ? "Loading..." : `Show ${count} results`}
      </button>
    </div>
  );
}

function ActiveTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bt-primary/5 border border-bt-primary/15 text-bt-primary text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:bg-bt-primary/10 rounded-full p-0.5 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-bt-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <PropertiesContent />
    </Suspense>
  );
}
