"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Navigation, History, Loader2, ArrowRight, X, ShieldAlert } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { PRESET_LOCATIONS, searchPresetLocations, PresetLocation } from "@/lib/presetLocations";

interface AreaSearchProps {
  currentLocation: string;
  currentState: string;
  onSelectLocation: (location: string, state: string) => void;
  isLoading?: boolean;
}

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
  const [suggestions, setSuggestions] = useState<PresetLocation[]>([]);
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

  // Filter suggestions strictly against preset locations
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions(PRESET_LOCATIONS.slice(0, 8));
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
        // High-speed strictly preset fallback
        const presetMatches = searchPresetLocations(query);
        setSuggestions(presetMatches);
      }
    }, 150);

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
    setSuggestions(PRESET_LOCATIONS.slice(0, 8));
  };

  const handleAnalyze = () => {
    if (!query.trim()) return;

    if (suggestions.length > 0) {
      handleSelect(suggestions[0].name, suggestions[0].state);
      return;
    }

    // Try finding preset match
    const matched = searchPresetLocations(query);
    if (matched.length > 0) {
      handleSelect(matched[0].name, matched[0].state);
      return;
    }

    // Default to currently selected location
    handleSelect(currentLocation || "Uyo", currentState || "Akwa Ibom");
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
          const target = data.address?.state || data.address?.city || "Uyo";
          const matched = searchPresetLocations(target);
          if (matched.length > 0) {
            handleSelect(matched[0].name, matched[0].state);
          } else {
            handleSelect("Uyo", "Akwa Ibom");
          }
        } catch {
          handleSelect("Uyo", "Akwa Ibom");
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
      {/* Search Input Bar (Matching Screenshot 0) */}
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
            placeholder="Search preset locations (e.g. Uyo, Lekki Phase 1, Yaba, Wuse 2)"
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
            className="px-3 sm:px-6 py-2.5 sm:py-3 bg-bt-primary hover:bg-bt-primary-light text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-sm hover:shadow active:scale-95 transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Analyzing...</span>
              </>
            ) : (
              <>
                <span className="inline sm:hidden">Analyze</span>
                <span className="hidden sm:inline">Analyze Area</span>
              </>
            )}
          </button>
        </div>

        {/* Autocomplete & Recents Dropdown (Strictly Preset Locations Only) */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 divide-y divide-gray-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-96 overflow-y-auto">
            {suggestions.length > 0 ? (
              <div className="p-2">
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Preset Verified Locations
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
            ) : (
              <div className="p-4 text-center">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl mb-3">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  No preset location matches &quot;{query}&quot;
                </div>
                <div className="text-xs font-semibold text-gray-500 mb-2">
                  Please select one of our verified locations:
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {PRESET_LOCATIONS.slice(0, 6).map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelect(preset.name, preset.state)}
                      className="px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-bt-primary hover:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="p-2 bg-gray-50/50">
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" /> Recent Preset Areas
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
    </div>
  );
}