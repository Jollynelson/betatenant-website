"use client";

import React, { useState } from "react";
import { 
  X, 
  ArrowLeftRight, 
  Sparkles, 
  Loader2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Coins, 
  Car, 
  CloudRain, 
  Zap, 
  Droplet 
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { ComparisonData, AreaGistData } from "./types";

interface CompareAreasModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentArea: { name: string; state: string };
}

const PRESET_RIVALS: Record<string, Array<{ name: string; state: string }>> = {
  yaba: [
    { name: "Gbagada", state: "Lagos" },
    { name: "Surulere", state: "Lagos" },
    { name: "Ikeja", state: "Lagos" },
  ],
  gbagada: [
    { name: "Yaba", state: "Lagos" },
    { name: "Ogudu", state: "Lagos" },
    { name: "Maryland", state: "Lagos" },
  ],
  lekki: [
    { name: "Ikoyi", state: "Lagos" },
    { name: "Victoria Island", state: "Lagos" },
    { name: "Ajah", state: "Lagos" },
  ],
  "ewet housing": [
    { name: "Shelter Afrique", state: "Akwa Ibom" },
    { name: "Osongama Estate", state: "Akwa Ibom" },
  ],
  "shelter afrique": [
    { name: "Ewet Housing", state: "Akwa Ibom" },
    { name: "Osongama Estate", state: "Akwa Ibom" },
  ],
};

export function CompareAreasModal({
  isOpen,
  onClose,
  currentArea,
}: CompareAreasModalProps) {
  const [secondArea, setSecondArea] = useState("Gbagada");
  const [secondState, setSecondState] = useState(currentArea.state || "Lagos");
  const [budget, setBudget] = useState("");
  const [commute, setCommute] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const currentKey = currentArea.name.toLowerCase();
  const rivals = PRESET_RIVALS[currentKey] || [
    { name: "Gbagada", state: "Lagos" },
    { name: "Yaba", state: "Lagos" },
    { name: "Ikeja", state: "Lagos" },
  ];

  const handleRunComparison = async (area2: string, st2: string) => {
    setIsLoading(true);
    setErrorMsg("");
    setComparisonResult(null);

    try {
      const params = new URLSearchParams({
        area1: currentArea.name,
        state1: currentArea.state,
        area2,
        state2: st2,
      });
      if (budget) params.set("budget", budget);
      if (commute) params.set("commute", commute);

      const res = await fetch(`${API_BASE_URL}/v1/area-gist/compare?${params.toString()}`);
      const json = await res.json();

      if (res.ok && json.success) {
        setComparisonResult(json.data);
      } else {
        setErrorMsg(json.message || "Failed to compare areas. Please try again.");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    if (!val) return "₦0";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-bt-primary/10 text-bt-primary">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-gray-950">
                Compare {currentArea.name} vs Another Neighbourhood
              </h3>
              <p className="text-xs text-gray-500">
                Side-by-side rent, flood risks, commute trade-offs, and living conditions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Top Form: Select Rival & Preferences */}
          <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-200/80">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Compare with:
                </label>
                <input
                  type="text"
                  value={secondArea}
                  onChange={(e) => setSecondArea(e.target.value)}
                  placeholder="e.g. Gbagada or Surulere"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-gray-900 focus:outline-none focus:border-bt-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Your Max Rent (₦/yr)
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. 2500000"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-bt-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Daily Work Destination
                </label>
                <input
                  type="text"
                  value={commute}
                  onChange={(e) => setCommute(e.target.value)}
                  placeholder="e.g. Victoria Island or Ikeja"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-bt-primary"
                />
              </div>
            </div>

            {/* Quick Rivals Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-200/60">
              <span className="text-xs font-medium text-gray-500 mr-1">Popular match-ups:</span>
              {rivals.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setSecondArea(r.name);
                    setSecondState(r.state);
                    handleRunComparison(r.name, r.state);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:border-bt-primary hover:text-bt-primary transition-colors cursor-pointer"
                >
                  {r.name}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handleRunComparison(secondArea, secondState)}
                disabled={isLoading || !secondArea.trim()}
                className="ml-auto inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-bt-primary hover:bg-bt-primary-light disabled:opacity-50 transition-all cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowLeftRight className="w-3.5 h-3.5" />}
                Compare Now
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-bt-primary mx-auto" />
              <div className="text-sm font-bold text-gray-900">
                Comparing {currentArea.name} vs {secondArea}...
              </div>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Synthesizing median rents, flood risk data, commute nodes, and resident intelligence across both axes.
              </p>
            </div>
          )}

          {/* Comparison Result View */}
          {comparisonResult && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* AI Verdict Banner */}
              <div className="bg-gradient-to-r from-bt-primary/10 via-purple-50 to-bt-secondary/10 border border-bt-primary/20 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-bt-primary mb-1.5">
                  <Sparkles className="w-4 h-4 text-bt-secondary" />
                  Synthesis & Recommendation
                </div>
                <div className="text-sm sm:text-base font-bold text-gray-950 leading-relaxed">
                  "{comparisonResult.comparisonSummary.verdict}"
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-200/60 text-xs">
                  <span className="px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-800">
                    💰 Rent Winner: {comparisonResult.comparisonSummary.rentWinner}
                  </span>
                  <span className="px-2.5 py-1 rounded-full font-semibold bg-blue-100 text-blue-800">
                    🏠 Inventory Winner: {comparisonResult.comparisonSummary.availableOptionsWinner}
                  </span>
                  {comparisonResult.comparisonSummary.weatherAlert && (
                    <span className="px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-800">
                      ⚠️ {comparisonResult.comparisonSummary.weatherAlert}
                    </span>
                  )}
                </div>
              </div>

              {/* Side-by-Side Stat Cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Area 1 Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4">
                  <div className="text-xs font-bold text-bt-primary uppercase tracking-wider mb-0.5">Area 1</div>
                  <h4 className="text-lg font-extrabold text-gray-950 mb-2">
                    {comparisonResult.area1.locationName}
                  </h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div>
                      <strong>Median Rent:</strong> {formatCurrency(comparisonResult.area1.stats.medianRent)}/yr
                    </div>
                    <div>
                      <strong>Available Homes:</strong> {comparisonResult.area1.stats.totalAvailableListings}
                    </div>
                    {comparisonResult.area1.weather && (
                      <div>
                        <strong>Weather:</strong> {Math.round(comparisonResult.area1.weather.temperature)}°C ({comparisonResult.area1.weather.condition})
                      </div>
                    )}
                  </div>
                </div>

                {/* Area 2 Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4">
                  <div className="text-xs font-bold text-bt-secondary uppercase tracking-wider mb-0.5">Area 2</div>
                  <h4 className="text-lg font-extrabold text-gray-950 mb-2">
                    {comparisonResult.area2.locationName}
                  </h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div>
                      <strong>Median Rent:</strong> {formatCurrency(comparisonResult.area2.stats.medianRent)}/yr
                    </div>
                    <div>
                      <strong>Available Homes:</strong> {comparisonResult.area2.stats.totalAvailableListings}
                    </div>
                    {comparisonResult.area2.weather && (
                      <div>
                        <strong>Weather:</strong> {Math.round(comparisonResult.area2.weather.temperature)}°C ({comparisonResult.area2.weather.condition})
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dimension Comparison Table */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 font-bold text-xs text-gray-700 uppercase tracking-wider border-b border-gray-200">
                  Head-to-Head Dimensions
                </div>
                <div className="divide-y divide-gray-100">
                  {["Commute & Transport", "Drainage & Flooding", "Power & Electricity", "Water Access", "Security"].map((dimName, i) => {
                    const r1 = comparisonResult.area1.rentalReality?.find((r) => r.dimension.toLowerCase().includes(dimName.split(" ")[0].toLowerCase()));
                    const r2 = comparisonResult.area2.rentalReality?.find((r) => r.dimension.toLowerCase().includes(dimName.split(" ")[0].toLowerCase()));

                    return (
                      <div key={i} className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 hover:bg-gray-50/50 transition-colors">
                        <div>
                          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                            {dimName} — {comparisonResult.area1.locationName}
                          </div>
                          <div className="text-xs text-gray-800 leading-relaxed font-normal">
                            {r1?.findings || "Normal conditions reported."}
                          </div>
                          {r1?.status && (
                            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                              Status: {r1.status}
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                            {dimName} — {comparisonResult.area2.locationName}
                          </div>
                          <div className="text-xs text-gray-800 leading-relaxed font-normal">
                            {r2?.findings || "Normal conditions reported."}
                          </div>
                          {r2?.status && (
                            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                              Status: {r2.status}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
