"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { PropertyCard } from "@/components/property/property-card";
import { HowItWorks } from "@/components/shared/how-it-works";
import { CTASection } from "@/components/shared/cta-section";
import { MOCK_PROPERTIES } from "@/lib/mock-data";
import { searchLocations, type LocationItem } from "@/lib/locations";
import { Shield, Users, Home, TrendingUp, Search, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />

      {/* Listings Section */}
      <section className="py-12 md:py-20">
        <div className="max-w-[1360px] mx-auto px-5 lg:px-10">
          <div className="flex items-end justify-between mb-8 md:mb-10">
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-neutral-900">
                Some available listings
              </h2>
              <p className="text-sm text-neutral-500 mt-1 hidden sm:block">
                Fresh properties verified by our team
              </p>
            </div>
            <Link
              href="/properties"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-bt-primary hover:text-bt-primary-light transition-colors group"
            >
              View all
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
            {MOCK_PROPERTIES.filter((p) => p.type === "rent")
              .slice(0, 8)
              .map((property) => (
                <PropertyCard key={property._id} property={property} />
              ))}
          </div>
        </div>
      </section>

      <HowItWorks />
      <CTASection />
    </div>
  );
}

function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<LocationItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    const found = searchLocations(value);
    setResults(found);
    setShowDropdown(found.length > 0);
  };

  const handleSelectLocation = (item: LocationItem) => {
    setSearchQuery(`${item.city}, ${item.state}`);
    setShowDropdown(false);
    router.push(
      `/properties?state=${encodeURIComponent(item.state)}&lga=${encodeURIComponent(item.city)}&type=rent`
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      handleSelectLocation(results[0]);
    } else if (searchQuery) {
      router.push(`/properties?q=${encodeURIComponent(searchQuery)}&type=rent`);
    }
  };

  return (
    <section className="relative overflow-hidden h-[560px] sm:h-[692px]">
      {/* Map Background */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-bg-desktop.png"
          alt=""
          fill
          className="object-cover hidden sm:block"
          priority
        />
        <Image
          src="/images/hero-bg-mobile.svg"
          alt=""
          fill
          className="object-cover sm:hidden"
          priority
        />
      </div>

      {/* Decorative pin dots */}
      <div className="absolute inset-0 pointer-events-none hidden xl:block">
        <Image
          src="/icons/eli-hero-1.svg"
          alt=""
          width={24}
          height={24}
          className="absolute top-[30%] left-[15%] opacity-80"
        />
        <Image
          src="/icons/eli-hero-2.svg"
          alt=""
          width={24}
          height={24}
          className="absolute top-[50%] left-[8%] opacity-50"
        />
        <Image
          src="/icons/eli-hero-3.svg"
          alt=""
          width={24}
          height={24}
          className="absolute top-[70%] right-[12%] opacity-30"
        />
      </div>

      {/* Left decorative tag */}
      <div className="absolute left-[40px] top-[26%] hidden xl:block pointer-events-none">
        <Image
          src="/images/hero-extra-tag.svg"
          alt=""
          width={226}
          height={256}
        />
      </div>

      {/* Right decorative tag */}
      <div className="absolute right-[5%] bottom-[20%] hidden xl:block pointer-events-none">
        <Image
          src="/images/hero-right-tag.svg"
          alt=""
          width={237}
          height={375}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="max-w-[587px] mx-auto px-5 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-[32px] sm:text-[40px] lg:text-[48px] font-bold text-neutral-900 leading-tight lg:leading-[60px] tracking-[-0.02em]">
              The perfect house awaits. Start your search now!
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-neutral-600 font-medium max-w-[480px] mx-auto leading-relaxed">
              Explore our curated selection of rental properties and find one
              that suits you.
            </p>
          </motion.div>

          {/* Rentals Tab */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8"
          >
            <div className="flex items-center justify-center mb-4">
              <button className="px-5 py-2 text-sm font-semibold text-bt-secondary border-b-2 border-bt-secondary">
                Rentals
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative" ref={dropdownRef}>
              <form
                onSubmit={handleSubmit}
                className="flex items-center w-full border border-neutral-200 rounded-full px-4 pr-1.5 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_28px_rgba(0,0,0,0.1)] transition-shadow"
              >
                <Image
                  src="/icons/u_search.svg"
                  alt=""
                  width={20}
                  height={20}
                  className="opacity-60 shrink-0"
                />
                <input
                  type="text"
                  placeholder="Search for a location..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => results.length > 0 && setShowDropdown(true)}
                  className="w-full py-[14px] px-2.5 placeholder:text-base text-base placeholder:text-neutral-400 placeholder:font-medium bg-transparent focus:outline-none"
                />
                <button
                  type="submit"
                  className="shrink-0 w-10 h-10 rounded-full bg-bt-primary flex items-center justify-center hover:bg-bt-primary-light transition-colors shadow-sm"
                >
                  <Search className="w-4 h-4 text-white" />
                </button>
              </form>

              {/* Dropdown Results */}
              {showDropdown && results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-100 rounded-2xl shadow-[0px_20px_48px_6px_rgba(0,0,0,0.08)] overflow-hidden z-50"
                >
                  {results.map((item, i) => (
                    <button
                      key={`${item.state}-${item.city}-${i}`}
                      onClick={() => handleSelectLocation(item)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-neutral-50 transition-colors border-b border-neutral-50 last:border-b-0"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#CECEE4]/30 flex items-center justify-center shrink-0">
                        <svg
                          className="w-4 h-4 text-bt-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {item.city}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {item.state}
                        </p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}

              {/* No results */}
              {showDropdown &&
                searchQuery.length >= 2 &&
                results.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-100 rounded-2xl shadow-[0px_20px_48px_6px_rgba(0,0,0,0.08)] p-5 text-center z-50"
                  >
                    <p className="text-sm text-neutral-500">
                      We&apos;re not in your city yet, but we&apos;re expanding
                      fast!
                    </p>
                  </motion.div>
                )}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-5 md:gap-8"
          >
            <Stat icon={Home} value="2,000+" label="Properties" />
            <Stat icon={Users} value="200+" label="Agents" />
            <Stat icon={Shield} value="1,800+" label="Users" />
            <Stat icon={TrendingUp} value="98%" label="Satisfaction" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl bg-white/80 border border-neutral-100 flex items-center justify-center shadow-sm">
        <Icon className="w-4 h-4 text-bt-primary" />
      </div>
      <div className="text-left">
        <p className="text-sm font-bold text-neutral-900">{value}</p>
        <p className="text-[11px] text-neutral-500">{label}</p>
      </div>
    </div>
  );
}
