"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

// Use the interface from backend or recreate here
export interface ICountryPack {
  countryCode: string;
  countryName: string;
  currencyCode: string;
  currencySymbol: string;
  regions?: { key: string; name: string }[];
  geographySchema: { level: number; name: string; key: string }[];
  propertyTypes: { key: string; label: string; description?: string }[];
  amenities: { key: string; label: string }[];
  verificationDocuments: { key: string; label: string }[];
  pricingModels: { feeKey: string; label: string; type: "monthly" | "yearly" | "one-time"; required: boolean }[];
  whatsappParserConfiguration: { phoneRegex: string; countryCodePrefix: string };
}

interface CountryContextType {
  activeCountry: string;
  countryPack: ICountryPack | null;
  loading: boolean;
  setCountry: (code: string) => void;
  availablePacks: ICountryPack[];
}

const CountryContext = createContext<CountryContextType>({
  activeCountry: "NG", // Default
  countryPack: null,
  loading: true,
  setCountry: () => {},
  availablePacks: [],
});

export const CountryProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeCountry, setActiveCountry] = useState("NG");
  const [countryPack, setCountryPack] = useState<ICountryPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [availablePacks, setAvailablePacks] = useState<ICountryPack[]>([]);

  useEffect(() => {
    // 1. Check URL first (?country=KE)
    const urlParams = new URLSearchParams(window.location.search);
    const urlCountry = urlParams.get("country");
    
    // 2. Fallback to localStorage
    const stored = urlCountry || localStorage.getItem("bt_country");
    if (stored) setActiveCountry(stored.toUpperCase());
    
    // Fetch all available packs
    api.get<{ successful: boolean; data: ICountryPack[] }>("/v1/country-packs")
      .then((res) => {
        if (res.successful && res.data) {
          setAvailablePacks(res.data);
          
          // Identify the current pack
          const current = stored ? stored.toUpperCase() : "NG";
          const pack = res.data.find(p => p.countryCode === current) || res.data.find(p => p.countryCode === "NG") || res.data[0];
          
          setCountryPack(pack);
          setActiveCountry(pack.countryCode);
          if (pack.countryCode !== localStorage.getItem("bt_country")) {
            localStorage.setItem("bt_country", pack.countryCode);
          }
        }
      })
      .catch((err) => console.error("Failed to load country packs", err))
      .finally(() => setLoading(false));
  }, []);

  const setCountry = (code: string) => {
    const codeUpper = code.toUpperCase();
    const pack = availablePacks.find(p => p.countryCode === codeUpper);
    if (pack) {
      setActiveCountry(codeUpper);
      setCountryPack(pack);
      localStorage.setItem("bt_country", codeUpper);
      // Optional: Refresh the page or trigger re-render of components
      // window.location.reload(); 
    }
  };

  return (
    <CountryContext.Provider value={{ activeCountry, countryPack, loading, setCountry, availablePacks }}>
      {children}
    </CountryContext.Provider>
  );
};

export const useCountry = () => useContext(CountryContext);
