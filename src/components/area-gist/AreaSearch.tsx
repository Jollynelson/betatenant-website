"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Navigation, History, Sparkles, Loader2, ArrowRight, X } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { locationData } from "@/lib/locations";

interface AreaSearchProps {
  currentLocation: string;
  currentState: string;
  onSelectLocation: (location: string, state: string) => void;
  isLoading?: boolean;
}

const POPULAR_SEARCHES = [
  { name: "Lekki Phase 1", state: "Lagos" },
  { name: "Yaba", state: "Lagos" },
  { name: "Ikeja", state: "Lagos" },
  { name: "Wuse 2", state: "Abuja" },
  { name: "Gwarinpa", state: "Abuja" },
  { name: "Bodija", state: "Oyo" },
  { name: "Uyo", state: "Akwa Ibom" },
];

export function AreaSearch({
  currentLocation,
  currentState,
  onSelectLocation,
  isLoading,
}: AreaSearchProps) {
  const [query, setQuery] = useState(
    currentLocation ? `${currentLocation}${currentState ? `, ${currentState}` : ""}` : ""
  );
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ name: string; lga: string; state: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [recentSearches, setRecentSearches] = useState<Array<{ name: string; state: string }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync query when currentLocation / currentState changes externally
  useEffect(() => {
    if (currentLocation) {
      setQuery(`${currentLocation}${currentState ? `, ${currentState}` : ""}`);
    }
  }, [currentLocation, currentState]);

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
      let foundServer = false;
      try {
        const res = await fetch(`${API_BASE_URL}/v1/area-gist/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.suggestions) && json.suggestions.length > 0) {
          setSuggestions(json.suggestions);
          foundServer = true;
        }
      } catch (err) {
        console.warn("Autocomplete error:", err);
      } finally {
        setIsSearching(false);
      }

      if (!foundServer) {
        // High-speed offline local fallback from locationData
        const qLower = query.toLowerCase().trim();
        const localMatches: Array<{ name: string; lga: string; state: string }> = [];
        for (const item of locationData) {
          for (const city of item.cities) {
            if (city.toLowerCase().includes(qLower) || item.state.toLowerCase().includes(qLower)) {
              localMatches.push({ name: city, lga: city, state: item.state });
              if (localMatches.length >= 8) break;
            }
          }
          if (localMatches.length >= 8) break;
        }
        setSuggestions(localMatches);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (name: string, state: string) => {
    setQuery(`${name}${state ? `, ${state}` : ""}`);
    onSelectLocation(name, state);
    setIsOpen(false);

    // Save to recents
    try {
      const updated = [{ name, state }, ...recentSearches.filter((s) => s.name.toLowerCase() !== name.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("BT_RECENT_AREA_SEARCHES", JSON.stringify(updated));
    } catch {}
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
  };

  const handleAnalyze = () => {
    if (!query.trim()) return;

    if (suggestions.length > 0) {
      handleSelect(suggestions[0].name, suggestions[0].state);
      return;
    }

    // Parse "Name, State" if present
    const parts = query.split(",").map((s) => s.trim());
    if (parts.length >= 2) {
      handleSelect(parts[0], parts[1]);
    } else {
      handleSelect(parts[0], currentState || "Lagos");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAnalyze();
    }
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
        <div className="relative flex items-center bg-white rounded-2xl shadow-md hover:shadow-lg border border-gray-200 hover:border-bt-primary/40 focus-within:border-bt-primary focus-within:ring-4 focus-within:ring-bt-primary/10 transition-all p-1.5 sm:p-2">
          {/* Search Icon */}
          <div className="pl-3 pr-2 text-gray-400">
            {isLoading || isSearching ? (
              <Loader2 className="w-5 h-5 animate-spin text-bt-secondary" />
            ) : (
              <Search className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {/* Text Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Which area are you thinking of renting in? (e.g. Uyo, Lekki, Yaba)"
            className="w-full bg-transparent text-gray-950 placeholder:text-gray-400 text-sm sm:text-base font-semibold focus:outline-none px-1 py-1"
          />

          {/* Clear Button [X] */}
          {query.trim().length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors mr-1 cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Use My Location Icon Button */}
          <button
            type="button"
            onClick={handleUseLocation}
            disabled={locatingUser}
            className="p-2 text-gray-400 hover:text-bt-primary rounded-xl hover:bg-bt-primary/5 transition-colors mr-1.5 cursor-pointer shrink-0"
            title="Use current location"
          >
            <Navigation className={`w-4 h-4 ${locatingUser ? "animate-spin text-bt-secondary" : ""}`} />
          </button>

          {/* Prominent [Analyze Area] Button */}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isLoading}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-bt-primary hover:bg-bt-primary-light text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-sm hover:shadow active:scale-95 transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Analyzing...</span>
              </>
            ) : (
              <span>Analyze Area</span>
            )}
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
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{rec.name}, {rec.state}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Popular searches inline row under search bar (Matching the wireframe) */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-3 px-1 text-xs text-gray-500">
        <span className="font-medium text-gray-400">Popular searches:</span>
        {POPULAR_SEARCHES.map((pill, idx) => {
          const isSelected = currentLocation.toLowerCase() === pill.name.toLowerCase();
          return (
            <React.Fragment key={idx}>
              <button
                type="button"
                onClick={() => handleSelect(pill.name, pill.state)}
                className={`font-semibold hover:text-bt-primary hover:underline transition-colors cursor-pointer ${
                  isSelected ? "text-bt-primary font-bold underline" : "text-gray-600"
                }`}
              >
                {pill.name}
              </button>
              {idx < POPULAR_SEARCHES.length - 1 && (
                <span className="text-gray-300 select-none">·</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
