"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, TrendingUp, Clock, ArrowRight, X,
} from "lucide-react";
import { searchLocations, type LocationItem } from "@/lib/locations";
import { APARTMENT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const LS_KEY = "BT_RecentSearches";
const MAX_RECENT = 5;

const POPULAR_SEARCHES = [
  { label: "2 Bedroom in Lekki",      state: "Lagos",      lga: "Lekki",    type: "two-bedroom" },
  { label: "Self Contained in Yaba",  state: "Lagos",      lga: "Surulere", type: "self-contained" },
  { label: "Apartments in VI",        state: "Lagos",      lga: "Victoria Island", type: "" },
  { label: "3 Bedroom in Ikeja",      state: "Lagos",      lga: "Ikeja",    type: "three-bedroom" },
  { label: "Mini Flat in Abuja",      state: "FCT - Abuja", lga: "",        type: "mini-flat/one-bedroom" },
  { label: "Self Contained in PH",    state: "Rivers",     lga: "",         type: "self-contained" },
];

const TOP_STATES = ["Lagos", "FCT - Abuja", "Rivers", "Ogun", "Oyo", "Kano"];

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]").filter((s: any) => typeof s === "string"); }
  catch { return []; }
}

function saveRecent(term: string) {
  if (!term.trim()) return;
  const updated = [term, ...readRecent().filter((s) => s !== term)].slice(0, MAX_RECENT);
  try { localStorage.setItem(LS_KEY, JSON.stringify(updated)); } catch {}
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [locationResults, setLocationResults] = useState<LocationItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecentSearches(readRecent());
    // Auto-focus on mount
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (value.trim().length >= 1) {
      const found = searchLocations(value);
      setLocationResults(found.slice(0, 8));
      setShowDropdown(found.length > 0);
    } else {
      setLocationResults([]);
      setShowDropdown(false);
    }
  };

  const handleSelectLocation = (item: LocationItem) => {
    const label = `${item.city}, ${item.state}`;
    setQuery(label);
    setShowDropdown(false);
    saveRecent(label);
    setRecentSearches(readRecent());
    router.push(`/properties?state=${encodeURIComponent(item.state)}&lga=${encodeURIComponent(item.city)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locationResults.length > 0) {
      handleSelectLocation(locationResults[0]);
      return;
    }
    if (query.trim()) {
      saveRecent(query.trim());
      setRecentSearches(readRecent());
      router.push(`/properties?state=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleStateClick = (state: string) => {
    saveRecent(state);
    setRecentSearches(readRecent());
    router.push(`/properties?state=${encodeURIComponent(state)}`);
  };

  const handlePopularClick = (search: typeof POPULAR_SEARCHES[0]) => {
    const params = new URLSearchParams();
    if (search.state) params.set("state", search.state);
    if (search.lga) params.set("lga", search.lga);
    if (search.type) params.set("apartmentType", search.type);
    saveRecent(search.label);
    setRecentSearches(readRecent());
    router.push(`/properties?${params.toString()}`);
  };

  const handleRecentClick = (term: string) => {
    // Try to parse "City, State" format from saved searches
    const parts = term.split(", ");
    if (parts.length === 2) {
      const params = new URLSearchParams();
      params.set("state", parts[1]);
      params.set("lga", parts[0]);
      router.push(`/properties?${params.toString()}`);
    } else {
      router.push(`/properties?state=${encodeURIComponent(term)}`);
    }
  };

  const clearRecent = () => {
    try { localStorage.removeItem(LS_KEY); } catch {}
    setRecentSearches([]);
  };

  const showDefault = !query && !showDropdown;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-24">

        {/* ── Search input with autocomplete dropdown ── */}
        <div className="relative" ref={dropdownRef}>
          <form
            onSubmit={handleSubmit}
            className="flex items-center w-full border border-neutral-200 rounded-2xl pl-4 pr-2 bg-white shadow-sm focus-within:shadow-[0_4px_24px_rgba(10,8,118,0.1)] focus-within:border-bt-primary/40 transition-all duration-200"
          >
            <Search className="w-5 h-5 text-neutral-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search city, area or state..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => locationResults.length > 0 && setShowDropdown(true)}
              className="w-full py-4 px-3 text-base text-neutral-900 placeholder:text-neutral-400 bg-transparent focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setLocationResults([]); setShowDropdown(false); inputRef.current?.focus(); }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="shrink-0 w-10 h-10 rounded-xl bg-bt-primary flex items-center justify-center hover:bg-bt-primary-light active:scale-95 transition-all ml-1"
            >
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </form>

          {/* Autocomplete dropdown */}
          <AnimatePresence>
            {showDropdown && locationResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-100 rounded-2xl shadow-[0_16px_48px_-12px_rgba(0,0,0,0.15)] overflow-hidden z-50"
              >
                {locationResults.map((item, i) => (
                  <button
                    key={`${item.state}-${item.city}-${i}`}
                    onClick={() => handleSelectLocation(item)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-neutral-50 active:bg-neutral-100 transition-colors border-b border-neutral-50 last:border-0"
                  >
                    <div className="w-9 h-9 rounded-xl bg-bt-primary/8 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-bt-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-900">{item.city}</p>
                      <p className="text-xs text-neutral-400">{item.state}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Quick state pills ── */}
        {showDefault && (
          <div className="flex flex-wrap gap-2 mt-4">
            {TOP_STATES.map((state) => (
              <button
                key={state}
                onClick={() => handleStateClick(state)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-white border border-neutral-200 text-neutral-700 hover:border-bt-primary/40 hover:bg-bt-primary/4 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                {state}
              </button>
            ))}
          </div>
        )}

        {/* ── Recent Searches ── */}
        {showDefault && recentSearches.length > 0 && (
          <div className="mt-7">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-500 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Searches
              </h3>
              <button onClick={clearRecent} className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors">
                Clear
              </button>
            </div>
            <div className="space-y-0.5">
              {recentSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => handleRecentClick(search)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-neutral-50 active:bg-neutral-100 transition-colors text-left"
                >
                  <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span className="text-sm text-neutral-800 flex-1">{search}</span>
                  <ArrowRight className="w-4 h-4 text-neutral-300" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Popular Searches ── */}
        {showDefault && (
          <div className="mt-7">
            <h3 className="text-sm font-semibold text-neutral-500 flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4" />
              Popular Searches
            </h3>
            <div className="space-y-2">
              {POPULAR_SEARCHES.map((search, i) => (
                <motion.button
                  key={search.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => handlePopularClick(search)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-neutral-100 hover:border-bt-primary/20 hover:bg-bt-primary/4 active:bg-bt-primary/8 transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-bt-primary/8 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-bt-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">{search.label}</p>
                    {search.type && (
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {APARTMENT_TYPES.find((t) => t.value === search.type)?.label ?? ""}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-300 shrink-0" />
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* ── Browse by State ── */}
        {showDefault && (
          <div className="mt-7">
            <h3 className="text-sm font-semibold text-neutral-500 mb-3">Browse by State</h3>
            <div className="flex flex-wrap gap-2">
              {["Lagos", "FCT - Abuja", "Rivers", "Kano", "Ogun", "Oyo", "Delta", "Edo", "Anambra", "Enugu", "Imo", "Akwa Ibom", "Cross River"].map((state) => (
                <button
                  key={state}
                  onClick={() => handleStateClick(state)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-50 text-neutral-600 hover:bg-bt-primary/8 hover:text-bt-primary transition-colors"
                >
                  {state}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
