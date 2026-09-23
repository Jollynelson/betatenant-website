"use client";

import React from "react";
import { useCountry } from "./CountryProvider";

export function CountrySwitcher() {
  const { activeCountry, setCountry, availablePacks, loading } = useCountry();

  if (loading || availablePacks.length <= 1) {
    return null; // Don't show if loading or only 1 country is supported
  }

  return (
    <div className="relative">
      <select
        value={activeCountry}
        onChange={(e) => setCountry(e.target.value)}
        className="w-full cursor-pointer appearance-none rounded-lg bg-neutral-100/50 px-3 py-2 pr-8 text-left text-sm font-medium text-neutral-700 shadow-sm border border-neutral-200 hover:bg-neutral-100 transition-colors outline-none focus:ring-2 focus:ring-bt-primary focus:border-transparent"
        aria-label="Select Country"
      >
        {availablePacks.map((pack) => (
          <option key={pack.countryCode} value={pack.countryCode}>
            {pack.countryName}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        <svg
          className="h-4 w-4 text-neutral-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
    </div>
  );
}
