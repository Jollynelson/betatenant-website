"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { PropertyCard } from "@/components/property/property-card";
import { HowItWorks } from "@/components/shared/how-it-works";
import { CTASection } from "@/components/shared/cta-section";
import { propertyApi } from "@/lib/api";
import { searchLocations, type LocationItem } from "@/lib/locations";
import { Shield, Users, Home, BadgeCheck, Search, ArrowRight, MapPin, Star, Flame, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <FeaturedSpotlightSection />
      <ListingsSection />
      <LocationDiscovery />
      <HowItWorks />
      <TestimonialsSection />
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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    const found = searchLocations(value);
    setResults(found);
    setShowDropdown(value.length >= 2 && found.length > 0);
  };

  const handleSelectLocation = (item: LocationItem) => {
    setSearchQuery(`${item.city}, ${item.state}`);
    setShowDropdown(false);
    router.push(`/properties?state=${encodeURIComponent(item.state)}&lga=${encodeURIComponent(item.city)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) handleSelectLocation(results[0]);
    else if (searchQuery) router.push(`/properties?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <section className="relative overflow-hidden h-[380px] sm:h-[560px] lg:h-[640px]">
      <div className="absolute inset-0">
        <Image src="/images/hero-bg-desktop.png" alt="" fill className="object-cover hidden sm:block" priority />
        <Image src="/images/hero-bg-mobile.svg" alt="" fill className="object-cover sm:hidden" priority />
      </div>
      <div className="absolute inset-0 pointer-events-none hidden xl:block">
        <Image src="/icons/eli-hero-1.svg" alt="" width={24} height={24} className="absolute top-[30%] left-[15%] opacity-80" />
        <Image src="/icons/eli-hero-2.svg" alt="" width={24} height={24} className="absolute top-[50%] left-[8%] opacity-50" />
        <Image src="/icons/eli-hero-3.svg" alt="" width={24} height={24} className="absolute top-[70%] right-[12%] opacity-30" />
        <div className="absolute left-[40px] top-[26%]">
          <Image src="/images/hero-extra-tag.svg" alt="" width={226} height={256} />
        </div>
        <div className="absolute right-[5%] bottom-[20%]">
          <Image src="/images/hero-right-tag.svg" alt="" width={237} height={375} />
        </div>
      </div>

      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="max-w-[600px] w-full mx-auto px-5 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <h1 className="text-[28px] sm:text-[36px] lg:text-[46px] font-extrabold text-neutral-900 leading-[1.15] tracking-[-0.03em]">
              The perfect house awaits.<br />
              <span className="text-bt-primary">Start your search now!</span>
              {/* Hidden SEO context — read by search engines, invisible to users */}
              <span className="sr-only"> Find flats and houses for rent in Nigeria — self-contains, mini flats, 2 and 3 bedroom flats across Lagos, Abuja, Port Harcourt, Uyo and all 36 states.</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-neutral-600 font-medium max-w-[460px] mx-auto leading-relaxed">
              Explore our curated selection of rental properties and find one that suits you.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.12 }} className="mt-8">
            <div className="flex items-center justify-center mb-4">
              <span className="px-4 py-1.5 text-sm font-semibold text-bt-secondary border-b-2 border-bt-secondary">
                Rentals
              </span>
            </div>
            <div className="relative" ref={dropdownRef}>
              <form
                onSubmit={handleSubmit}
                className="flex items-center w-full border border-neutral-200 rounded-full pl-5 pr-1.5 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_32px_rgba(0,0,0,0.1)] focus-within:shadow-[0_6px_32px_rgba(10,8,118,0.12)] focus-within:border-bt-primary/30 transition-all duration-200"
              >
                <Search className="w-[18px] h-[18px] text-neutral-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by city, area or state..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => results.length > 0 && setShowDropdown(true)}
                  className="w-full py-[15px] px-3 text-[15px] placeholder:text-neutral-400 placeholder:font-medium bg-transparent focus:outline-none"
                />
                <button type="submit" className="shrink-0 w-10 h-10 rounded-full bg-bt-primary flex items-center justify-center hover:bg-bt-primary-light active:scale-95 transition-all">
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </form>

              {showDropdown && results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-100 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden z-50"
                >
                  {results.map((item, i) => (
                    <button
                      key={`${item.state}-${item.city}-${i}`}
                      onClick={() => handleSelectLocation(item)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-neutral-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-bt-primary/5 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-bt-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{item.city}</p>
                        <p className="text-xs text-neutral-400">{item.state}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function SocialProof() {
  return (
    <div className="border-b border-neutral-100 bg-white">
      <div className="max-w-[1360px] mx-auto px-5 lg:px-10 py-5 flex flex-wrap items-center justify-center gap-6 md:gap-10 lg:gap-14">
        <ProofItem icon={Home} value="2,000+" label="Verified Listings" />
        <div className="hidden sm:block w-px h-8 bg-neutral-200" />
        <ProofItem icon={BadgeCheck} value="200+" label="Vetted Agents" />
        <div className="hidden sm:block w-px h-8 bg-neutral-200" />
        <ProofItem icon={Users} value="1,800+" label="Happy Tenants" />
        <div className="hidden sm:block w-px h-8 bg-neutral-200" />
        <ProofItem icon={Shield} value="100%" label="Secure Process" />
      </div>
    </div>
  );
}

function ProofItem({ icon: Icon, value, label }: { icon: React.ComponentType<{ className?: string }>; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="w-5 h-5 text-bt-primary" />
      <div>
        <span className="text-sm font-bold text-neutral-900">{value}</span>
        <span className="text-sm text-neutral-500 ml-1.5">{label}</span>
      </div>
    </div>
  );
}

// ── Featured & Spotlight section ─────────────────────────────────────────────
function FeaturedSpotlightSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["home-promoted"],
    queryFn: () => propertyApi.search({ sortBy: undefined, page: 1, limit: 12 }),
    staleTime: 1000 * 60 * 5,
  });

  // Filter to promoted listings — spotlight > featured > boost
  const promoted = (data?.properties ?? [])
    .filter((p: any) => p.promotionPackage === "spotlight" || p.promotionPackage === "featured" || p.promotionPackage === "boost" || p.isPromoted)
    .sort((a: any, b: any) => {
      const rank: Record<string, number> = { spotlight: 3, featured: 2, boost: 1 };
      return (rank[b.promotionPackage] ?? 0) - (rank[a.promotionPackage] ?? 0);
    });

  if (isLoading || promoted.length === 0) return null;

  return (
    <section className="py-10 bg-white">
      <div className="max-w-[1360px] mx-auto px-5 lg:px-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-[#FF4500]/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-[#FF4500]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Featured & Spotlight Listings</h2>
            <p className="text-sm text-neutral-500">Premium placements by verified agents</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {promoted.slice(0, 4).map((p: any) => (
            <PropertyCard key={p._id} property={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ListingsSection() {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["home-listings"],
    queryFn: () => propertyApi.list(1, 8),
    staleTime: 1000 * 60 * 5,
  });

  return (
    <section className="py-12 md:py-20 bg-bt-surface">
      <div className="max-w-[1360px] mx-auto px-5 lg:px-10">
        <div className="flex items-end justify-between mb-8 md:mb-10">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-neutral-900 tracking-[-0.02em]">Available Listings</h2>
            <p className="text-sm text-neutral-500 mt-1">Recently added, verified properties</p>
          </div>
          <Link href="/properties" className="inline-flex items-center gap-1.5 text-sm font-semibold text-bt-primary hover:text-bt-primary-light transition-colors group">
            See all <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {isLoading && !data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-neutral-100 animate-pulse h-[320px]" />
            ))}
          </div>
        ) : (
          <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5", isFetching && "opacity-95")}>
            {(data?.properties ?? []).map((property) => (
              <PropertyCard key={property._id} property={property} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function LocationDiscovery() {
  const cities = [
    { name: "Lagos", slug: "lagos", areas: "Lekki, VI, Ikeja, Yaba, Surulere", count: "1,200+", image: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=400&q=80&auto=format" },
    { name: "Abuja", slug: "abuja", areas: "Maitama, Wuse 2, Gwarinpa, Jabi", count: "400+", image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80&auto=format" },
    { name: "Port Harcourt", slug: "port-harcourt", areas: "GRA, Rumuola, Woji, Ada George", count: "180+", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80&auto=format" },
    { name: "Uyo", slug: "uyo", areas: "Uyo, Eket, Akwa Ibom State", count: "120+", image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80&auto=format" },
  ];

  const popularAreas = [
    { name: "Lekki", slug: "lagos/lekki" },
    { name: "Yaba", slug: "lagos/yaba" },
    { name: "Surulere", slug: "lagos/surulere" },
    { name: "Gwarinpa", slug: "abuja/gwarinpa" },
    { name: "Wuse 2", slug: "abuja/wuse-2" },
    { name: "Ibadan", slug: "ibadan" },
    { name: "Enugu", slug: "enugu" },
    { name: "Warri", slug: "warri" },
  ];

  return (
    <section className="py-12 md:py-20">
      <div className="max-w-[1360px] mx-auto px-5 lg:px-10">
        <div className="mb-8 md:mb-10">
          <h2 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-neutral-900 tracking-[-0.02em]">Find Flats to Rent by Location</h2>
          <p className="text-sm text-neutral-500 mt-1">Browse verified rentals in Nigeria&apos;s top cities</p>
        </div>

        {/* City cards — links to SEO location pages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cities.map((loc, i) => (
            <motion.div key={loc.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <Link href={`/properties/${loc.slug}`} className="group block relative h-[200px] rounded-2xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={loc.image} alt={`Flats and houses for rent in ${loc.name}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-lg font-bold text-white">Houses to Let in {loc.name}</h3>
                  <p className="text-sm text-white/70 mt-0.5">{loc.areas}</p>
                  <p className="text-xs text-white/50 mt-1">{loc.count} listings</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Popular area quick-links — SEO internal links */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-neutral-400 font-medium py-1.5 mr-1">Popular areas:</span>
          {popularAreas.map((area) => (
            <Link key={area.slug} href={`/properties/${area.slug}`}
              className="px-3 py-1.5 rounded-full border border-neutral-200 text-xs text-neutral-600 hover:border-bt-primary/40 hover:text-bt-primary hover:bg-bt-primary/5 transition-colors">
              Self contain {area.name}
            </Link>
          ))}
          <Link href="/renting-guide" className="px-3 py-1.5 rounded-full border border-neutral-200 text-xs text-neutral-500 hover:border-neutral-300 transition-colors">
            Renting guide →
          </Link>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    { name: "Adaobi C.", location: "Lagos", text: "I found my apartment in Lekki within 3 days. The agent was verified and everything was transparent. No more scam stories!", rating: 5 },
    { name: "Tunde A.", location: "Abuja", text: "As someone who relocated from Port Harcourt, Beta Tenant made finding a home in Abuja stress-free. The location search is incredibly useful.", rating: 5 },
    { name: "Blessing O.", location: "Rivers", text: "I love the agent rating system. I was able to avoid a fraudulent agent because of the reviews from other tenants. This platform is a lifesaver.", rating: 5 },
  ];

  return (
    <section className="py-12 md:py-20 bg-bt-surface">
      <div className="max-w-[1360px] mx-auto px-5 lg:px-10">
        <div className="text-center mb-10">
          <h2 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-neutral-900 tracking-[-0.02em]">Trusted by Thousands of Tenants</h2>
          <p className="text-sm text-neutral-500 mt-2">See what our community has to say</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white rounded-2xl p-6 border border-neutral-100">
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, si) => (
                  <Star key={si} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-bt-primary/10 flex items-center justify-center text-bt-primary text-xs font-bold">
                  {t.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{t.name}</p>
                  <p className="text-xs text-neutral-400">{t.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
