"use client";

import React from "react";
import { useCountry } from "./CountryProvider";
import { Listbox } from "@headlessui/react";
import { ChevronDownIcon, CheckIcon } from "@heroicons/react/20/solid";

export function CountrySwitcher() {
  const { activeCountry, setCountry, availablePacks, loading } = useCountry();

  if (loading || availablePacks.length <= 1) {
    return null; // Don't show if loading or only 1 country is supported
  }

  const selected = availablePacks.find((p) => p.countryCode === activeCountry) || availablePacks[0];

  return (
    <div className="relative z-50">
      <Listbox value={activeCountry} onChange={setCountry}>
        <div className="relative mt-1">
          <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white/10 px-3 py-2 text-left shadow-sm sm:text-sm flex items-center gap-2 border border-white/20 hover:bg-white/20 transition-colors">
            <span className="block truncate font-medium">{selected?.countryName || "Nigeria"}</span>
            <span className="pointer-events-none flex items-center">
              <ChevronDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </span>
          </Listbox.Button>
          <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
            {availablePacks.map((pack) => (
              <Listbox.Option
                key={pack.countryCode}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                    active ? "bg-primary-50 text-primary-900" : "text-gray-900"
                  }`
                }
                value={pack.countryCode}
              >
                {({ selected }) => (
                  <>
                    <span className={`block truncate ${selected ? "font-medium text-primary-600" : "font-normal"}`}>
                      {pack.countryName}
                    </span>
                    {selected ? (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </div>
      </Listbox>
    </div>
  );
}
