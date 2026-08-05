"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Heart, Share2, MapPin, Bed, Bath, Maximize2, Star,
  Shield, Check, ChevronLeft, ChevronRight, BadgeCheck, Eye, Clock, Phone, Mail, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isFavorited, toggleFavorite } from "@/lib/favorites";
import { formatPriceFullNumber, AMENITY_ICONS, amenitySlugToKey } from "@/lib/constants";
import { propertyApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { PropertyCard } from "@/components/property/property-card";
import type { Property } from "@/types";

const APARTMENT_TYPE_LABELS: Record<string, string> = {
  "single-room/shared-apartment": "Single Room / Shared Apartment",
  "self-contained": "Self Contained",
  "mini-flat/one-bedroom": "Mini Flat / 1 Bedroom",
  "two-bedroom": "2 Bedroom Flat",
  "three-bedroom": "3 Bedroom Flat",
  "four-bedroom": "4 Bedroom Flat",
  "big-family-house-4plus": "Big Family House (4+ Bedrooms)",
};

const WHATSAPP_SVG = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "price", label: "Price Breakdown" },
  { key: "rules", label: "House Rules" },
] as const;

type Tab = (typeof TABS)[number]["key"];

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { token } = useAuthStore();
  const isLoggedIn = !!token;
  const [currentImage, setCurrentImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const requireAuth = (action: () => void) => {
    if (!isLoggedIn) {
      router.push(`/auth/login?from=${encodeURIComponent(`/property/${id}`)}`);
      return;
    }
    action();
  };

  const { data, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: () => propertyApi.get(id),
    staleTime: 1000 * 60 * 5,
  });

  const property = data?.property;
  const similarProperties = data?.similarProperties ?? [];

  useEffect(() => {
    if (property?._id) setLiked(isFavorited(property._id));
  }, [property?._id]);

  if (isLoading) return <PropertySkeleton />;

  if (!property) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-neutral-500 mb-4">Property not found</p>
        <Link href="/properties" className="text-bt-primary font-medium text-sm">Browse all properties</Link>
      </div>
    </div>
  );

  const apartmentLabel = APARTMENT_TYPE_LABELS[property.apartmentType] || property.apartmentType;

  const scrollToSection = (key: Tab) => {
    setActiveTab(key);
    const el = document.getElementById(`tab-${key}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile gallery */}
      <div className="md:hidden relative">
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
          <Image src={property.photos[currentImage] || "/placeholder-property.jpg"} alt={property.title} fill className="object-cover" priority />
          <div className="absolute inset-0 flex items-center justify-between px-3">
            <button onClick={() => setCurrentImage(currentImage > 0 ? currentImage - 1 : property.photos.length - 1)} className="w-11 h-11 rounded-full bg-white/95 flex items-center justify-center shadow-md">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setCurrentImage(currentImage < property.photos.length - 1 ? currentImage + 1 : 0)} className="w-11 h-11 rounded-full bg-white/95 flex items-center justify-center shadow-md">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4">
            <Link href="/properties" className="w-11 h-11 rounded-full bg-white/95 flex items-center justify-center shadow-md">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <button onClick={() => setLiked(toggleFavorite(property._id))} className="w-11 h-11 rounded-full bg-white/95 flex items-center justify-center shadow-md">
                <Heart className={cn("w-4 h-4", liked ? "fill-red-500 text-red-500" : "text-neutral-700")} />
              </button>
              <button className="w-11 h-11 rounded-full bg-white/95 flex items-center justify-center shadow-md">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
            {property.photos.slice(0, 6).map((_: string, i: number) => (
              <span key={i} className={cn("h-1.5 rounded-full transition-all", i === currentImage ? "bg-white w-4" : "bg-white/50 w-1.5")} />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop gallery */}
      <div className="hidden md:block max-w-[1360px] mx-auto px-5 lg:px-10 pt-6">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[460px]">
          <div className="col-span-2 row-span-2 relative group cursor-pointer">
            <Image src={property.photos[0] || "/placeholder-property.jpg"} alt={property.title} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-500" sizes="(max-width: 768px) 100vw, 50vw" priority />
            {property.host?.isVerified && (
              <div className="absolute top-4 left-4 px-2.5 py-1 rounded-lg bg-bt-success text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
                <BadgeCheck className="w-3.5 h-3.5" /> Verified Listing
              </div>
            )}
          </div>
          {property.photos.slice(1, 5).map((photo: string, i: number) => (
            <div key={i} className="relative group cursor-pointer overflow-hidden">
              <Image src={photo} alt={`Photo ${i + 2}`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 50vw, 25vw" />
              {i === 3 && property.photos.length > 5 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">+{property.photos.length - 5} photos</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[1360px] mx-auto px-5 lg:px-10 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

          {/* Left */}
          <div className="lg:col-span-2">
            {/* Title */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-full bg-bt-primary/8 text-bt-primary text-xs font-semibold">For Rent</span>
                <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-medium">{apartmentLabel}</span>
                {property.isPromoted && <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">Featured</span>}
              </div>
              <h1 className="text-2xl md:text-[28px] font-bold text-neutral-900 tracking-[-0.02em] leading-snug">{property.title}</h1>
              <p className="text-[15px] text-neutral-500 mt-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                {property.address}, {property.lga}, {property.state}
              </p>
              <p className="text-[22px] font-bold text-bt-primary mt-3">
                {formatPriceFullNumber(property.price)}
                <span className="text-sm font-normal text-neutral-500 ml-1">/year</span>
              </p>
            </div>

            {/* Quick stats — backend only has bathroomCount, no toiletCount */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl bg-bt-surface border border-neutral-100 mb-6">
              <StatBlock icon={Bed} value={String(property.bedrooms)} label={property.bedrooms === 1 ? "Bedroom" : "Bedrooms"} />
              <div className="hidden sm:block w-px h-9 bg-neutral-200" />
              <StatBlock icon={Bath} value={String(property.bathrooms)} label={property.bathrooms === 1 ? "Bathroom" : "Bathrooms"} />
              {!!property.rating && (
                <>
                  <div className="hidden sm:block w-px h-9 bg-neutral-200" />
                  <StatBlock icon={Star} value={property.rating.toFixed(1)} label={`${property.reviewCount} reviews`} highlight />
                </>
              )}
              <div className="ml-auto flex items-center gap-1 text-xs text-neutral-400">
                <Eye className="w-3.5 h-3.5" />
                {(property.views ?? 0).toLocaleString()} views
              </div>
            </div>

            {/* Tab nav */}
            <div className="sticky top-[72px] lg:top-[78px] z-20 bg-white border-b border-neutral-200 -mx-5 px-5 lg:-mx-10 lg:px-10 mb-0">
              <div className="flex overflow-x-auto no-scrollbar">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => scrollToSection(tab.key)}
                    className={cn(
                      "px-5 py-4 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px",
                      activeTab === tab.key ? "border-bt-primary text-bt-primary" : "border-transparent text-neutral-500 hover:text-neutral-800"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content card */}
            <div className="rounded-2xl border border-neutral-200 shadow-[0_2px_12px_rgba(0,0,0,0.04)] mt-5">
              <div className="divide-y divide-neutral-100">

                {/* Overview */}
                <div id="tab-overview" className="p-6">
                  <h2 className="text-base font-bold text-neutral-900 mb-3">Overview</h2>
                  <p className="text-[15px] text-neutral-600 leading-relaxed mb-6">{property.description}</p>
                  {property.amenities.length > 0 && (
                    <>
                      <h3 className="text-sm font-bold text-neutral-900 mb-3">Amenities</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {property.amenities.map((amenity: string) => {
                          const directKey = amenitySlugToKey(amenity.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-"));
                          const iconSrc = AMENITY_ICONS[directKey] || Object.entries(AMENITY_ICONS).find(([k]) => amenity.toLowerCase().replace(/\s/g, "").includes(k.toLowerCase()))?.[1];
                          return (
                            <div key={amenity} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
                              {iconSrc ? <Image src={iconSrc} alt="" width={18} height={18} className="w-[18px] h-[18px] object-contain shrink-0" /> : <Check className="w-3.5 h-3.5 text-bt-success shrink-0" />}
                              <span className="text-sm text-neutral-700">{amenity}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Price Breakdown */}
                <div id="tab-price" className="p-6">
                  <h2 className="text-base font-bold text-neutral-900 mb-4">Price Breakdown</h2>
                  <div className="rounded-xl border border-neutral-100 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100">
                      <span className="text-sm text-neutral-500">Annual Rent</span>
                      <span className="text-sm font-semibold text-neutral-900">{formatPriceFullNumber(property.price)}</span>
                    </div>
                    {!!property.cautionFee && (
                      <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100">
                        <span className="text-sm text-neutral-500">Caution Fee</span>
                        <span className="text-sm font-semibold text-neutral-900">{formatPriceFullNumber(property.cautionFee)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100">
                      <span className="text-sm text-neutral-500">Agency Fee (est. 10%)</span>
                      <span className="text-sm font-semibold text-neutral-900">{formatPriceFullNumber(Math.round(property.price * 0.1))}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3.5 bg-bt-primary/5">
                      <span className="text-sm font-bold text-neutral-900">Estimated Total</span>
                      <span className="text-sm font-bold text-bt-primary">
                        {formatPriceFullNumber(property.price + (property.cautionFee || 0) + Math.round(property.price * 0.1))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* House Rules */}
                <div id="tab-rules" className="p-6">
                  <h2 className="text-base font-bold text-neutral-900 mb-4">House Rules</h2>
                  {property.houseRules.length > 0 ? (
                    <ul className="space-y-3">
                      {property.houseRules.map((rule: string) => (
                        <li key={rule} className="flex items-start gap-3 text-sm text-neutral-600">
                          <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center mt-0.5 shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                          </div>
                          {rule}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-neutral-500">No specific house rules listed.</p>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* Right: Contact card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-[0_2px_16px_rgba(0,0,0,0.05)]"
              >
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">
                  {property.host.role === "agent" ? "Listed by Agent" : "Listed by Landlord"}
                </p>

                {/* Agent identity */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="relative shrink-0">
                    {property.host.avatar ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden relative">
                        <Image src={property.host.avatar} alt={property.host.firstName} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-bt-primary/8 flex items-center justify-center text-bt-primary font-bold text-base">
                        {property.host.firstName[0]}{property.host.lastName[0]}
                      </div>
                    )}
                    {property.host.isVerified && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-bt-success border-2 border-white flex items-center justify-center">
                        <BadgeCheck className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[15px] font-semibold text-neutral-900 capitalize">
                        {property.host.firstName} {property.host.lastName}
                      </p>
                      {property.host.isVerified && <BadgeCheck className="w-4 h-4 text-bt-success shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-neutral-500 capitalize">{property.host.role}</span>
                      {!!property.host.rating && (
                        <>
                          <span className="text-neutral-300">·</span>
                          <span className="flex items-center gap-0.5 text-xs text-neutral-500">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {property.host.rating.toFixed(1)} ({property.host.reviewCount})
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <hr className="border-neutral-100 mb-4" />

                {/* Contact info — blurred when not logged in, exactly like live site */}
                <div className="space-y-3 mb-5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Uploaded by</span>
                    <span className="font-medium text-neutral-900 capitalize">{property.host.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Name</span>
                    <span className={cn("font-medium text-neutral-900 capitalize", !isLoggedIn && "blur-[5px] select-none tracking-widest")}>
                      {isLoggedIn ? `${property.host.firstName} ${property.host.lastName}` : "●●●● ●●●●●●"}
                    </span>
                  </div>
                  {property.host.phone && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Phone</span>
                      <span className={cn("font-medium text-neutral-900", !isLoggedIn && "blur-[5px] select-none tracking-widest")}>
                        {isLoggedIn ? property.host.phone : "+234 ●●● ●●● ●●●●"}
                      </span>
                    </div>
                  )}
                  {property.host.email && !property.host.email.endsWith("@imported.betatenant.local") && (
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-neutral-500 shrink-0">Email</span>
                      <span className={cn("font-medium text-neutral-900 text-right break-all", !isLoggedIn && "blur-[5px] select-none")}>
                        {isLoggedIn ? property.host.email : "●●●●●@●●●●●●.com"}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-neutral-400">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs">Responds within 2 hours</span>
                  </div>
                </div>

                {/* Login prompt when not logged in */}
                {!isLoggedIn && (
                  <div className="mb-4 p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-neutral-400 shrink-0" />
                    <p className="text-xs text-neutral-500 flex-1">
                      Sign in to view contact details and reach out to the {property.host.role}.
                    </p>
                    <Link
                      href={`/auth/login?from=${encodeURIComponent(`/property/${id}`)}`}
                      className="text-xs font-semibold text-bt-primary hover:underline shrink-0"
                    >
                      Sign in
                    </Link>
                  </div>
                )}

                <hr className="border-neutral-100 mb-4" />

                {/* Buttons — gated behind auth, same as live site */}
                <div className="space-y-2.5">
                  {property.host.phone && (
                    isLoggedIn ? (
                      <a href={`tel:${property.host.phone}`} className="w-full py-3 rounded-full bg-bt-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-bt-primary-light transition-colors">
                        <Phone className="w-4 h-4" />
                        Call {property.host.role}
                      </a>
                    ) : (
                      <button onClick={() => requireAuth(() => {})} className="w-full py-3 rounded-full bg-bt-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-bt-primary-light transition-colors">
                        <Phone className="w-4 h-4" />
                        Call {property.host.role}
                      </button>
                    )
                  )}
                  {/* Only show Message for non-imported listings */}
                  {property.host.email && !property.host.email.endsWith("@imported.betatenant.local") && (
                    <button
                      onClick={() => requireAuth(() => router.push("/messages"))}
                      className="w-full py-3 rounded-full border border-neutral-200 text-neutral-700 font-medium text-sm flex items-center justify-center gap-2 hover:bg-neutral-50 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Message {property.host.role}
                    </button>
                  )}
                  {property.host.phone && (
                    isLoggedIn ? (
                      <a
                        href={`https://wa.me/${property.host.phone.replace(/\D/g, "")}?text=${encodeURIComponent("Hi, I would like to get more information on a property listed on Beta Tenant.")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 rounded-full bg-[#25D366] text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#1eb858] transition-colors"
                      >
                        {WHATSAPP_SVG}
                        WhatsApp {property.host.role}
                      </a>
                    ) : (
                      <button onClick={() => requireAuth(() => {})} className="w-full py-3 rounded-full bg-[#25D366] text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#1eb858] transition-colors">
                        {WHATSAPP_SVG}
                        WhatsApp {property.host.role}
                      </button>
                    )
                  )}
                </div>
              </motion.div>

              <div className="p-4 rounded-xl bg-bt-success/5 border border-bt-success/15 flex items-start gap-3">
                <Shield className="w-5 h-5 text-bt-success shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-neutral-900">BT Protected</p>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                    This listing is on Beta Tenant. Report any suspicious activity and we&apos;ll take action.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Properties */}
        {similarProperties.length > 0 && (
          <section className="mt-16 pt-10 border-t border-neutral-100">
            <h2 className="text-xl font-bold text-neutral-900 mb-6 tracking-[-0.02em]">Similar Properties</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {similarProperties.slice(0, 4).map((p: any) => (
                <PropertyCard key={p._id} property={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile sticky bar */}
      <div className="fixed bottom-16 left-0 right-0 md:hidden bg-white/95 backdrop-blur-md border-t border-neutral-100 px-5 py-3 flex items-center justify-between z-40 gap-3">
        <div>
          <p className="text-base font-bold text-neutral-900">{formatPriceFullNumber(property.price)}</p>
          <p className="text-xs text-neutral-500">per year</p>
        </div>
        <div className="flex items-center gap-2">
          {property.host.phone && (
            <>
              {isLoggedIn ? (
                <a href={`https://wa.me/${property.host.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I'm interested in the property listed on Beta Tenant: ${property.title}. Please share more details.`)}`} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full bg-[#25D366] text-white">
                  {WHATSAPP_SVG}
                </a>
              ) : (
                <button onClick={() => requireAuth(() => {})} className="p-3 rounded-full bg-[#25D366] text-white">
                  {WHATSAPP_SVG}
                </button>
              )}
              {isLoggedIn ? (
                <a href={`tel:${property.host.phone}`} className="px-5 py-3 rounded-full bg-bt-primary text-white font-semibold text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Call {property.host.role}
                </a>
              ) : (
                <button onClick={() => requireAuth(() => {})} className="px-5 py-3 rounded-full bg-bt-primary text-white font-semibold text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Call {property.host.role}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBlock({ icon: Icon, value, label, highlight }: { icon: React.ComponentType<{ className?: string }>; value: string; label: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("w-4 h-4 shrink-0", highlight ? "text-amber-400 fill-amber-400" : "text-neutral-400")} />
      <div>
        <p className="text-sm font-bold text-neutral-900">{value}</p>
        <p className="text-[11px] text-neutral-500">{label}</p>
      </div>
    </div>
  );
}

function PropertySkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="hidden md:block max-w-[1360px] mx-auto px-5 lg:px-10 pt-6">
        <div className="h-[460px] rounded-2xl bg-neutral-100 animate-pulse" />
      </div>
      <div className="max-w-[1360px] mx-auto px-5 lg:px-10 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-8 bg-neutral-100 rounded-lg animate-pulse w-3/4" />
            <div className="h-5 bg-neutral-100 rounded-lg animate-pulse w-1/2" />
            <div className="h-[200px] bg-neutral-100 rounded-2xl animate-pulse" />
          </div>
          <div className="h-[400px] bg-neutral-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
