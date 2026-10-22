"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Navigation, History, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface AreaSearchProps {
  currentLocation: string;
  currentState: string;
  onSelectLocation: (location: string, state: string) => void;
  isLoading?: boolean;
}

const POPULAR_PILLS = [
  { name: "Yaba", state: "Lagos" },
  { name: "Gbagada", state: "Lagos" },
  { name: "Lekki Phase 1", state: "Lagos" },
  { name: "Ewet Housing", state: "Akwa Ibom" },
  { name: "Ikeja", state: "Lagos" },
  { name: "Shelter Afrique", state: "Akwa Ibom" },
  { name: "Alimosho", state: "Lagos" },
  { name: "Uyo", state: "Akwa Ibom" },
];

export function AreaSearch({
  currentLocation,
  currentState,
  onSelectLocation,
  isLoading,
}: AreaSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ name: string; lga: string; state: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [recentSearches, setRecentSearches] = useState<Array<{ name: string; state: string }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("BT_RECENT_AREA_SEARCHES");
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 4));
      }
    } catch {}
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions when query changes
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${API_BASE_URL}/v1/area-gist/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.suggestions)) {
          setSuggestions(json.suggestions);
        }
      } catch (err) {
        console.warn("Autocomplete error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (name: string, state: string) => {
    onSelectLocation(name, state);
    setQuery("");
    setIsOpen(false);

    // Save to recents
    try {
      const updated = [{ name, state }, ...recentSearches.filter((s) => s.name.toLowerCase() !== name.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("BT_RECENT_AREA_SEARCHES", JSON.stringify(updated));
    } catch {}
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Reverse geocode via Open-Meteo or Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const suburb =
            data.address?.suburb ||
            data.address?.neighbourhood ||
            data.address?.city ||
            data.address?.town ||
            data.address?.state_district ||
            "Lagos";
          const state = data.address?.state || "Lagos";

          handleSelect(suburb, state);
        } catch {
          // Fallback to Lagos
          handleSelect("Yaba", "Lagos");
        } finally {
          setLocatingUser(false);
        }
      },
      (err) => {
        setLocatingUser(false);
        console.warn("Geolocation permission error:", err.message);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto" ref={containerRef}>
      {/* Search Input Bar */}
      <div className="relative">
        <div className="relative flex items-center bg-white rounded-2xl shadow-lg shadow-black/[0.04] border border-gray-200/80 hover:border-bt-primary/40 focus-within:border-bt-primary focus-within:ring-4 focus-within:ring-bt-primary/10 transition-all p-2 sm:p-2.5">
          <div className="pl-3 pr-2 text-bt-primary/70">
            {isLoading || isSearching ? (
              <Loader2 className="w-5 h-5 animate-spin text-bt-secondary" />
            ) : (
              <Search className="w-5 h-5 text-gray-400" />
            )}
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Which area are you thinking of renting in? (e.g. Yaba, Gbagada, Lekki)"
            className="w-full bg-transparent text-gray-900 placeholder:text-gray-400 text-sm sm:text-base font-medium focus:outline-none px-1"
          />

          <button
            type="button"
            onClick={handleUseLocation}
            disabled={locatingUser}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-bt-primary bg-bt-primary/5 hover:bg-bt-primary/10 active:scale-95 rounded-xl transition-all whitespace-nowrap ml-1 cursor-pointer"
            title="Search using your current approximate location"
          >
            <Navigation className={`w-3.5 h-3.5 ${locatingUser ? "animate-spin text-bt-secondary" : ""}`} />
            <span className="hidden sm:inline">Use my location</span>
          </button>
        </div>

        {/* Autocomplete & Recents Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 divide-y divide-gray-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {query.trim() && suggestions.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Neighborhood Matches
                </div>
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(item.name, item.state)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-bt-primary/5 text-left transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-bt-primary/10 flex items-center justify-center text-bt-primary group-hover:bg-bt-primary group-hover:text-white transition-colors">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 group-hover:text-bt-primary transition-colors">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.lga}, {item.state} State
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-bt-primary group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" /> Recent Areas
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
                  {recentSearches.map((rec, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelect(rec.name, rec.state)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{rec.name}, {rec.state}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Suggestions if query is empty */}
            {!query.trim() && (
              <div className="p-3 bg-gray-50/60">
                <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-bt-secondary" /> Popular Rental Hubs
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_PILLS.slice(0, 6).map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelect(p.name, p.state)}
                      className="px-2.5 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-bt-primary hover:text-bt-primary transition-colors"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Pills under search bar */}
      <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar py-1">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-bt-secondary" /> Trending:
        </span>
        {POPULAR_PILLS.map((pill, idx) => {
          const isSelected = currentLocation.toLowerCase() === pill.name.toLowerCase();
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(pill.name, pill.state)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? "bg-bt-primary text-white shadow-sm"
                  : "bg-white/80 hover:bg-white text-gray-700 border border-gray-200/80 hover:border-gray-300"
              }`}
            >
              {pill.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
