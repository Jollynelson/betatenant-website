"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Heart, Share2, MapPin, BedDouble, Bath, Star,
  Shield, Check, ChevronLeft, ChevronRight, BadgeCheck, Eye, Clock, Phone, Mail, Lock,
  Play, X, CircleX, ZoomIn, Edit3, RefreshCw, AlertTriangle, Trash2, Loader2, Zap,
  Crown, ShieldCheck, Briefcase, MessageSquare, Home, Flag, Sparkles,
  PawPrint, Cigarette, PartyPopper, Music, UserX, Baby,
} from "lucide-react";
import { BoostModal } from "@/components/boost-modal";
import { cn } from "@/lib/utils";
import { isFavorited, toggleFavorite } from "@/lib/favorites";
import { formatPriceFullNumber, AMENITY_ICONS, amenitySlugToKey } from "@/lib/constants";
import { propertyApi, api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import toast from "react-hot-toast";
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

// ─── House rule icon helper ───────────────────────────────────────────────────
function getRuleIcon(rule: string): React.ComponentType<{ className?: string }> {
  const r = rule.toLowerCase();
  if (r.includes("pet")) return PawPrint;
  if (r.includes("smok")) return Cigarette;
  if (r.includes("party") || r.includes("parties") || r.includes("event")) return PartyPopper;
  if (r.includes("music") || r.includes("noise") || r.includes("loud")) return Music;
  if (r.includes("visitor") || r.includes("guest")) return UserX;
  if (r.includes("child") || r.includes("children") || r.includes("kid")) return Baby;
  return Check;
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: paramId } = use(params);
  // Static export serves placeholder.html for all /property/:id URLs.
  // The real ID lives in the browser pathname, not in params.
  const id = typeof window !== "undefined"
    ? window.location.pathname.split("/property/")[1]?.split("/")[0] || paramId
    : paramId;
  const router = useRouter();
  const { token, user } = useAuthStore();
  const isLoggedIn = !!token;
  const touchStartX = useRef<number | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [videoOpen, setVideoOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [propertyStatus, setPropertyStatus] = useState<string | null>(null);
  const [boostOpen, setBoostOpen] = useState(false);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

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
    if (property?._id) {
      setLiked(isFavorited(property._id));
      setPropertyStatus(property.status ?? "available");
    }
  }, [property?._id, property?.status]);

  // Determine if current user is the owner
  const ownerId = property?.host?._id;
  const currentUserId = user?.userId ?? useAuthStore.getState().user?.userId;
  const isOwner = !!(isLoggedIn && ownerId && currentUserId && ownerId === currentUserId);

  const handleStatusChange = async (newStatus: string) => {
    if (!property) return;
    setActionLoading(true);
    try {
      await api.put(`/v1/landlordandagent/my-listings/${property._id}`, { propertyStatus: newStatus });
      setPropertyStatus(newStatus);
      toast.success(newStatus === "available" ? "Listing is now active" : newStatus === "delisted" ? "Listing delisted" : "Updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!property) return;
    if (!confirm("Permanently delete this listing? This cannot be undone.")) return;
    setActionLoading(true);
    try {
      await api.del(`/v1/landlordandagent/my-listings/${property._id}`);
      toast.success("Listing deleted");
      router.push("/account/properties");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
      setActionLoading(false);
    }
  };

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

      {/* ── MOBILE: full-screen immersive layout ─────────────────────────────── */}
      <div className="md:hidden">
        {/* Full-bleed photo — fills from status bar to fold, touch-swipeable */}
        <div
          className="relative w-full bg-neutral-900"
          style={{ height: "62vh", minHeight: 320 }}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(dx) > 40) {
              if (dx < 0) setCurrentImage((i) => (i < property.photos.length - 1 ? i + 1 : 0));
              else setCurrentImage((i) => (i > 0 ? i - 1 : property.photos.length - 1));
            }
            touchStartX.current = null;
          }}
        >
          <button
            className="absolute inset-0 w-full h-full"
            onClick={() => openLightbox(currentImage)}
            aria-label="View full image"
          >
            <Image
              src={property.photos[currentImage] || "/placeholder-property.jpg"}
              alt={property.title}
              fill
              className="object-cover"
              priority
            />
          </button>

          {/* Dark gradient at top for button legibility */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
          {/* Dark gradient at bottom for dots + price */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

          {/* Top bar: back + share/heart — safe area aware */}
          <div
            className="absolute left-0 right-0 flex items-center justify-between px-4 z-10"
            style={{ top: "calc(env(safe-area-inset-top) + 0.75rem)" }}
          >
            <Link
              href="/properties"
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    await navigator.share({ title: property.title, url: window.location.href });
                  } catch {
                    await navigator.clipboard.writeText(window.location.href).catch(() => {});
                  }
                }}
                className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center"
              >
                <Share2 className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => setLiked(toggleFavorite(property._id))}
                className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center"
              >
                <Heart className={cn("w-5 h-5", liked ? "fill-red-400 text-red-400" : "text-white")} />
              </button>
            </div>
          </div>

          {/* Photo counter */}
          <div className="absolute bottom-16 right-4 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-semibold">
            {currentImage + 1} / {property.photos.length}
          </div>

          {/* Swipe chevrons */}
          {property.photos.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImage(currentImage > 0 ? currentImage - 1 : property.photos.length - 1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => setCurrentImage(currentImage < property.photos.length - 1 ? currentImage + 1 : 0)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </>
          )}

          {/* Price overlaid on photo */}
          <div className="absolute bottom-5 left-5">
            <p className="text-white text-2xl font-bold drop-shadow-md">
              {formatPriceFullNumber(property.price)}
              <span className="text-sm font-normal text-white/80 ml-1">/yr</span>
            </p>
          </div>

          {/* Dot indicators */}
          <div className="absolute bottom-5 right-5 flex gap-1">
            {property.photos.slice(0, 6).map((_: string, i: number) => (
              <span key={i} className={cn("h-1.5 rounded-full transition-all", i === currentImage ? "bg-white w-4" : "bg-white/40 w-1.5")} />
            ))}
          </div>
        </div>

        {/* Bottom sheet content — rounded top corners like a native sheet */}
        <div className="relative -mt-5 bg-white rounded-t-3xl z-10 pb-[calc(5rem+env(safe-area-inset-bottom))]">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-neutral-200" />
          </div>

          <div className="px-5 pt-3">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-full bg-bt-primary/8 text-bt-primary text-xs font-semibold">For Rent</span>
              <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-medium">{apartmentLabel}</span>
              {property.host?.isVerified && (
                <span className="px-2.5 py-1 rounded-full bg-bt-success/10 text-bt-success text-xs font-semibold flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </div>

            {/* Title + location */}
            <h1 className="text-xl font-bold text-neutral-900 tracking-[-0.02em] leading-snug">{property.title}</h1>
            <p className="text-sm text-neutral-500 mt-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              {property.address}, {property.lga}, {property.state}
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-neutral-100">
              <div className="flex items-center gap-1.5 text-sm text-neutral-700">
                <BedDouble className="w-4 h-4 text-neutral-400" />
                <span className="font-semibold">{property.bedrooms}</span>
                <span className="text-neutral-400">{property.bedrooms === 1 ? "bed" : "beds"}</span>
              </div>
              <div className="w-px h-4 bg-neutral-200" />
              <div className="flex items-center gap-1.5 text-sm text-neutral-700">
                <Bath className="w-4 h-4 text-neutral-400" />
                <span className="font-semibold">{property.bathrooms}</span>
                <span className="text-neutral-400">{property.bathrooms === 1 ? "bath" : "baths"}</span>
              </div>
              {!!property.rating && (
                <>
                  <div className="w-px h-4 bg-neutral-200" />
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-neutral-700">{property.rating.toFixed(1)}</span>
                  </div>
                </>
              )}
              <div className="ml-auto flex items-center gap-1 text-xs text-neutral-400">
                <Eye className="w-3.5 h-3.5" />
                {(property.views ?? 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Video button — only shown when listing has a video */}
          {property.videos && property.videos.length > 0 && (
            <div className="px-5 mt-4">
              <button
                onClick={() => setVideoOpen(true)}
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-bt-primary/8 border border-bt-primary/20 text-bt-primary font-semibold text-sm hover:bg-bt-primary/12 active:scale-[0.98] transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-bt-primary flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 text-white fill-white" />
                </div>
                Watch Property Video
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="sticky top-0 z-20 bg-white border-b border-neutral-100 mt-4">
            <div className="flex overflow-x-auto no-scrollbar px-5">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => scrollToSection(tab.key)}
                  className={cn(
                    "px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-all",
                    activeTab === tab.key ? "border-bt-primary text-bt-primary" : "border-transparent text-neutral-400"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content sections */}
          <div className="px-5 pt-5 space-y-6">
            {/* Overview */}
            <div id="tab-overview">
              {property.description && (
                <p className="text-[15px] text-neutral-600 leading-relaxed">{property.description}</p>
              )}
              {property.amenities.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm font-bold text-neutral-900 mb-3">Amenities</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {property.amenities.map((amenity: string) => {
                      const directKey = amenitySlugToKey(amenity.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-"));
                      const iconSrc = AMENITY_ICONS[directKey] || Object.entries(AMENITY_ICONS).find(([k]) => amenity.toLowerCase().replace(/\s/g, "").includes(k.toLowerCase()))?.[1];
                      return (
                        <div key={amenity} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
                          {iconSrc ? <Image src={iconSrc} alt="" width={16} height={16} className="w-4 h-4 shrink-0" /> : <Sparkles className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
                          <span className="text-sm text-neutral-700">{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Price breakdown */}
            <div id="tab-price" className="pt-2 border-t border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900 mb-3">Price Breakdown</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between py-2 border-b border-neutral-50">
                  <span className="text-sm text-neutral-600">Annual Rent</span>
                  <span className="text-sm font-bold text-neutral-900">{formatPriceFullNumber(property.price)}</span>
                </div>
                {!!property.cautionFee && (
                  <div className="flex items-center justify-between py-2 border-b border-neutral-50">
                    <span className="text-sm text-neutral-600">Caution Fee</span>
                    <span className="text-sm font-semibold text-neutral-900">{formatPriceFullNumber(property.cautionFee)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-bold text-neutral-900">Total Move-in</span>
                  <span className="text-sm font-bold text-bt-primary">{formatPriceFullNumber(property.price + (property.cautionFee ?? 0))}</span>
                </div>
              </div>
            </div>

            {/* House rules */}
            {property.houseRules.length > 0 && (
              <div id="tab-rules" className="pt-2 border-t border-neutral-100">
                <h3 className="text-sm font-bold text-neutral-900 mb-3">House Rules</h3>
                <div className="flex flex-wrap gap-2">
                  {property.houseRules.map((rule: string) => {
                    const RuleIcon = getRuleIcon(rule);
                    return (
                      <div key={rule} className="flex items-center gap-2 px-3 py-2 rounded-full border border-neutral-200 bg-neutral-50 text-sm text-neutral-700">
                        <RuleIcon className="w-4 h-4 text-neutral-500 shrink-0" />
                        {rule}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Agent card */}
            <div className="border-t border-neutral-100 pt-5 pb-2">
              <div className="flex items-center gap-3">
                {property.host.avatar ? (
                  <Image src={property.host.avatar} alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-bt-primary/8 flex items-center justify-center shrink-0 text-bt-primary font-bold text-sm">
                    {property.host.firstName?.[0]}{property.host.lastName?.[0]}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-neutral-900 capitalize">{property.host.firstName} {property.host.lastName}</p>
                  <p className="text-xs text-neutral-500 capitalize">{property.host.role}</p>
                </div>
                {property.host.isVerified && (
                  <BadgeCheck className="w-4 h-4 text-bt-success ml-auto shrink-0" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile sticky CTA bar — above safe area */}
        <div
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 z-50 px-4 py-3 flex items-center gap-3"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
        {isOwner ? (
          /* Owner actions */
          <>
            {propertyStatus === "available" && (
              <button onClick={() => setBoostOpen(true)}
                className="w-12 h-12 rounded-full bg-bt-primary flex items-center justify-center shrink-0 shadow-md hover:bg-bt-primary-light transition-colors">
                <Zap className="w-5 h-5 text-white" />
              </button>
            )}
            <Link href={`/host/edit/${property._id}`}
              className="flex-1 py-3.5 rounded-full border border-bt-primary/30 bg-bt-primary/5 text-bt-primary font-bold text-sm flex items-center justify-center gap-2">
              <Edit3 className="w-4 h-4" /> Edit
            </Link>
            {(propertyStatus === "delisted" || propertyStatus === "draft") ? (
              <button onClick={() => handleStatusChange("available")} disabled={actionLoading}
                className="flex-1 py-3.5 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {propertyStatus === "draft" ? "Publish" : "Relist"}
              </button>
            ) : (
              <button onClick={() => handleStatusChange("delisted")} disabled={actionLoading}
                className="flex-1 py-3.5 rounded-full bg-neutral-100 text-neutral-700 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                Delist
              </button>
            )}
            <button onClick={handleDelete} disabled={actionLoading}
              className="w-12 h-12 rounded-full border border-red-100 flex items-center justify-center shrink-0 text-red-500 disabled:opacity-60">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </>
        ) : (<>
          {property.host.phone && (
            isLoggedIn ? (
              <a
                href={`tel:${property.host.phone}`}
                className="flex-1 py-3.5 rounded-full border border-neutral-200 flex items-center justify-center gap-2 text-neutral-700 font-bold text-sm"
              >
                <Phone className="w-5 h-5" />
                Call
              </a>
            ) : (
              <button
                onClick={() => requireAuth(() => {})}
                className="flex-1 py-3.5 rounded-full border border-neutral-200 flex items-center justify-center gap-2 text-neutral-700 font-bold text-sm"
              >
                <Phone className="w-5 h-5" />
                Call
              </button>
            )
          )}
          {property.host.phone && (
            isLoggedIn ? (
              <a
                href={`https://wa.me/${property.host.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I'm interested in the property listed on Beta Tenant: ${property.title}. Please share more details.`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 py-3.5 rounded-full bg-[#25D366] text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                WhatsApp
              </a>
            ) : (
              <button
                onClick={() => requireAuth(() => {})}
                className="flex-1 py-3.5 rounded-full bg-[#25D366] text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                WhatsApp
              </button>
            )
          )}
          {/* Save / Share / Report icon buttons */}
          <button
            onClick={() => setLiked(toggleFavorite(property._id))}
            className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center shrink-0"
            aria-label={liked ? "Remove from saved" : "Save listing"}
          >
            <Heart className={cn("w-4 h-4", liked ? "fill-red-500 text-red-500" : "text-neutral-600")} />
          </button>
          <button
            onClick={async () => {
              try {
                await navigator.share({ title: property.title, url: window.location.href });
              } catch {
                await navigator.clipboard.writeText(window.location.href).catch(() => {});
              }
            }}
            className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center shrink-0"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4 text-neutral-600" />
          </button>
          <button
            onClick={() => router.push(`/property/report?id=${id}`)}
            className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center shrink-0"
            aria-label="Report listing"
          >
            <Flag className="w-4 h-4 text-neutral-600" />
          </button>
          </>)}
        </div>
      </div>

      {/* Desktop back button bar */}
      <div className="hidden md:block max-w-[1360px] mx-auto px-5 lg:px-10 pt-4 pb-0">
        <Link
          href="/properties"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-neutral-200 bg-white text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to results
        </Link>
      </div>

      {/* Desktop gallery */}
      <div className="hidden md:block max-w-[1360px] mx-auto px-5 lg:px-10 pt-6">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[460px]">
          <button
            className="col-span-2 row-span-2 relative group cursor-pointer text-left"
            onClick={() => openLightbox(0)}
            aria-label="View photo 1"
          >
            <Image src={property.photos[0] || "/placeholder-property.jpg"} alt={property.title} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-500" sizes="(max-width: 768px) 100vw, 50vw" priority />
            {property.host?.isVerified && (
              <div className="absolute top-4 left-4 px-2.5 py-1 rounded-lg bg-bt-success text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
                <BadgeCheck className="w-3.5 h-3.5" /> Verified Listing
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <ZoomIn className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
          </button>
          {property.photos.slice(1, 5).map((photo: string, i: number) => (
            <button
              key={i}
              className="relative group cursor-pointer overflow-hidden"
              onClick={() => openLightbox(i + 1)}
              aria-label={`View photo ${i + 2}`}
            >
              <Image src={photo} alt={`Photo ${i + 2}`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 50vw, 25vw" />
              {i === 3 && property.photos.length > 5 ? (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                  <span className="text-white font-semibold text-sm">+{property.photos.length - 5} photos</span>
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <ZoomIn className="w-6 h-6 text-white drop-shadow-lg" />
                </div>
              )}
            </button>
          ))}
        </div>
        {/* "Show all photos" button */}
        {property.photos.length > 5 && (
          <div className="flex justify-end mt-2">
            <button
              onClick={() => openLightbox(0)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 text-sm font-semibold text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
              Show all {property.photos.length} photos
            </button>
          </div>
        )}
        {/* Video button under desktop gallery */}
        {property.videos && property.videos.length > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => setVideoOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-bt-primary/8 border border-bt-primary/20 text-bt-primary font-semibold text-sm hover:bg-bt-primary/12 transition-colors"
            >
              <Play className="w-4 h-4 fill-bt-primary" />
              Watch Video Tour
            </button>
          </div>
        )}
      </div>

      {/* Boost Modal */}
      {isOwner && property && (
        <BoostModal
          open={boostOpen}
          onClose={() => setBoostOpen(false)}
          propertyId={property._id}
          propertyName={property.title}
          onSuccess={(type) => {
            setBoostOpen(false);
            // Reflect boost badge visually if possible
          }}
        />
      )}

      {/* Photo Lightbox */}
      <PhotoLightbox
        photos={property.photos}
        open={lightboxOpen}
        index={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
      />

      {/* Video Modal */}
      {videoOpen && property.videos && property.videos.length > 0 && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setVideoOpen(false)}
        >
          <button
            onClick={() => setVideoOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Close video"
          >
            <CircleX className="w-5 h-5 text-white" />
          </button>
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <video
              controls
              autoPlay
              className="w-full rounded-2xl max-h-[80vh]"
              src={property.videos[0]}
            >
              <source src={property.videos[0]} type="video/mp4" />
              Your browser does not support video playback.
            </video>
          </div>
        </div>
      )}

      {/* Body — desktop only, mobile has its own bottom-sheet layout above */}
      <div className="hidden md:block max-w-[1360px] mx-auto px-5 lg:px-10 py-6 md:py-10">
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
              <StatBlock icon={BedDouble} value={String(property.bedrooms)} label={property.bedrooms === 1 ? "Bedroom" : "Bedrooms"} />
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
                              {iconSrc ? <Image src={iconSrc} alt="" width={18} height={18} className="w-[18px] h-[18px] object-contain shrink-0" /> : <Sparkles className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
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
                    <div className="flex flex-wrap gap-2">
                      {property.houseRules.map((rule: string) => {
                        const RuleIcon = getRuleIcon(rule);
                        return (
                          <div key={rule} className="flex items-center gap-2 px-3 py-2 rounded-full border border-neutral-200 bg-neutral-50 text-sm text-neutral-700">
                            <RuleIcon className="w-4 h-4 text-neutral-500 shrink-0" />
                            {rule}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500">No specific house rules listed.</p>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* Right: Owner actions or Contact card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">

              {/* Owner management card */}
              {isOwner && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-[0_2px_16px_rgba(0,0,0,0.05)] space-y-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Your Listing</p>
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold",
                      propertyStatus === "available" ? "bg-emerald-50 text-emerald-700" :
                      propertyStatus === "draft"     ? "bg-amber-50 text-amber-700" :
                      "bg-neutral-100 text-neutral-500"
                    )}>
                      {propertyStatus === "available" ? "Active" : propertyStatus === "draft" ? "Draft" : propertyStatus ?? ""}
                    </span>
                  </div>
                  {propertyStatus === "available" && (
                    <button onClick={() => setBoostOpen(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-bt-primary text-white text-sm font-bold hover:bg-bt-primary-light transition-colors">
                      <Zap className="w-4 h-4" /> Boost This Listing
                    </button>
                  )}
                  <Link href={`/host/edit/${property._id}`}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-bt-primary/30 bg-bt-primary/5 text-bt-primary text-sm font-semibold hover:bg-bt-primary/10 transition-colors">
                    <Edit3 className="w-4 h-4" /> Edit Listing
                  </Link>
                  {(propertyStatus === "delisted" || propertyStatus === "draft") ? (
                    <button onClick={() => handleStatusChange("available")} disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60">
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      {propertyStatus === "draft" ? "Publish" : "Relist"}
                    </button>
                  ) : (
                    <button onClick={() => handleStatusChange("delisted")} disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-100 text-neutral-700 text-sm font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-60">
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                      Delist Property
                    </button>
                  )}
                  <button onClick={handleDelete} disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-100 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-60">
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete Listing
                  </button>
                </motion.div>
              )}

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
                    {/* Gold ring = premium subscriber */}
                    <div className={cn("w-12 h-12 rounded-full",
                      property.host.isPremium ? "ring-2 ring-amber-400 ring-offset-1" : "")}>
                      {property.host.avatar ? (
                        <div className="w-full h-full rounded-full overflow-hidden relative">
                          <Image src={property.host.avatar} alt={property.host.firstName} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-full h-full rounded-full bg-bt-primary/8 flex items-center justify-center text-bt-primary font-bold text-base">
                          {property.host.firstName[0]}{property.host.lastName[0]}
                        </div>
                      )}
                    </div>
                    {/* Blue checkmark = identity verified */}
                    {property.host.isVerified && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-blue-600 border-2 border-white flex items-center justify-center">
                        <BadgeCheck className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-[15px] font-semibold text-neutral-900 capitalize">
                        {property.host.firstName} {property.host.lastName}
                      </p>
                      {/* Blue = identity verified, Gold = premium */}
                      {property.host.isVerified && <BadgeCheck className="w-4 h-4 text-blue-600 shrink-0" />}
                      {property.host.isPremium && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">★ Premium</span>
                      )}
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

                {/* Save / Share / Report — small pill row */}
                {!isOwner && (
                  <div className="flex items-center gap-2 pt-3 mt-1 border-t border-neutral-100">
                    <button
                      onClick={() => setLiked(toggleFavorite(property._id))}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-neutral-200 rounded-full px-3 py-2 text-xs text-neutral-600 hover:bg-neutral-50 transition-colors"
                      aria-label="Save listing"
                    >
                      <Heart className={cn("w-3.5 h-3.5", liked ? "fill-red-500 text-red-500" : "")} />
                      Save
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.share({ title: property.title, url: window.location.href });
                        } catch {
                          await navigator.clipboard.writeText(window.location.href).catch(() => {});
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-neutral-200 rounded-full px-3 py-2 text-xs text-neutral-600 hover:bg-neutral-50 transition-colors"
                      aria-label="Share"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Share
                    </button>
                    <button
                      onClick={() => router.push(`/property/report?id=${id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-neutral-200 rounded-full px-3 py-2 text-xs text-neutral-600 hover:bg-neutral-50 transition-colors"
                      aria-label="Report listing"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      Report
                    </button>
                  </div>
                )}
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

        {/* About the Agent — only shown to non-owners */}
        {!isOwner && <AgentExpandedCard property={property} similarProperties={similarProperties} requireAuth={requireAuth} isLoggedIn={isLoggedIn} router={router} />}

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

    </div>
  );
}

// ─── Agent Expanded Card ─────────────────────────────────────────────────────

const AGENT_WA_SVG = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

function AgentExpandedCard({
  property,
  similarProperties,
  requireAuth,
  isLoggedIn,
  router,
}: {
  property: any;
  similarProperties: any[];
  requireAuth: (action: () => void) => void;
  isLoggedIn: boolean;
  router: ReturnType<typeof import("next/navigation").useRouter>;
}) {
  const { data: reviewsData } = useQuery({
    queryKey: ["agent-reviews-detail", property.host._id],
    queryFn: () => api.get<any>(`/v1/landlordandagent/review/${property.host._id}`),
    enabled: !!property.host._id,
    staleTime: 1000 * 60 * 5,
  });

  const reviews: any[] = reviewsData?.reviews ?? reviewsData?.result ?? [];
  const avgRating = reviews.length
    ? reviews.reduce((acc: number, r: any) => acc + (r.rating ?? 0), 0) / reviews.length
    : (property.host.rating ?? 0);

  const [bioExpanded, setBioExpanded] = useState(false);

  // Use shareId if available (from profile), otherwise link via host._id
  const profileLink = property.host._id
    ? `/agents?hostId=${property.host._id}`
    : "/agents";

  // Other listings = up to 3 from similar (same agent is not guaranteed, just use similar)
  const otherListings = similarProperties.slice(0, 3);

  const joinedDate = property.host.joinedAt
    ? new Date(property.host.joinedAt).getFullYear()
    : null;

  return (
    <section className="mt-12 pt-10 border-t border-neutral-100">
      <h2 className="text-xl font-bold text-neutral-900 mb-5 tracking-[-0.02em]">About the {property.host.role}</h2>
      <div className="rounded-2xl border border-neutral-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] bg-white p-6 space-y-6">

        {/* Top identity row */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0 self-start">
            <div className={cn(
              "w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md",
              property.host.isPremium ? "ring-2 ring-amber-400 ring-offset-2" : ""
            )}>
              {property.host.avatar ? (
                <Image src={property.host.avatar} alt={property.host.firstName} width={64} height={64} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full bg-bt-primary/10 flex items-center justify-center text-bt-primary font-bold text-xl">
                  {property.host.firstName?.[0]}{property.host.lastName?.[0]}
                </div>
              )}
            </div>
            {property.host.isVerified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow">
                <BadgeCheck className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-lg font-bold text-neutral-900 capitalize">
                {property.host.firstName} {property.host.lastName}
              </h3>
              {property.host.isVerified && <BadgeCheck className="w-4 h-4 text-blue-600 shrink-0" />}
              {property.host.isPremium && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-bold">
                  <Crown className="w-3 h-3 fill-amber-700" /> Premium
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap text-sm text-neutral-500 mb-2">
              <span className="capitalize">{property.host.role}</span>
              {joinedDate && (
                <>
                  <span className="text-neutral-300">·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Joined {joinedDate}
                  </span>
                </>
              )}
              {avgRating > 0 && (
                <>
                  <span className="text-neutral-300">·</span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-neutral-700">{Number(avgRating).toFixed(1)}</span>
                    <span className="text-neutral-400">({reviews.length} reviews)</span>
                  </span>
                </>
              )}
            </div>

            {/* Stat chips */}
            <div className="flex flex-wrap gap-2">
              {!!property.host.listingCount && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-bt-primary/8 text-bt-primary text-xs font-medium">
                  <Home className="w-3 h-3" /> {property.host.listingCount} listings
                </span>
              )}
              {!!property.host.rating && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100">
                  <Eye className="w-3 h-3" /> {property.host.reviewCount} reviews
                </span>
              )}
              {property.host.isVerified && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                  <ShieldCheck className="w-3 h-3" /> ID Verified
                </span>
              )}
              {property.host.isPremium && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
                  <Crown className="w-3 h-3" /> Premium Agent
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bio (if any) */}
        {property.host.about && (
          <div>
            <p className={cn("text-sm text-neutral-600 leading-relaxed", !bioExpanded && "line-clamp-2")}>
              {property.host.about}
            </p>
            <button onClick={() => setBioExpanded((v) => !v)} className="text-xs font-semibold text-bt-primary mt-1 hover:underline">
              {bioExpanded ? "Show less" : "Read more"}
            </button>
          </div>
        )}

        {/* Top 2 reviews preview */}
        {reviews.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-neutral-700">Recent Reviews</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reviews.slice(0, 2).map((r: any) => (
                <div key={r._id} className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-neutral-800 capitalize truncate">
                      {r.reviewer?.firstName ?? "Anonymous"} {r.reviewer?.lastName ?? ""}
                    </p>
                    <div className="flex gap-0.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cn("w-3 h-3", s <= r.rating ? "fill-amber-400 text-amber-400" : "text-neutral-200")} />
                      ))}
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other listings by this agent */}
        {otherListings.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-neutral-700">Other Listings</h4>
              <Link href={profileLink} className="text-xs font-semibold text-bt-primary hover:underline">
                View all by this {property.host.role}
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {otherListings.map((p: any) => (
                <div key={p._id} className="w-[180px] shrink-0">
                  <PropertyCard property={p} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100">
          {property.host.phone && (
            isLoggedIn ? (
              <a href={`tel:${property.host.phone}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-neutral-200 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-colors">
                <Phone className="w-4 h-4" /> Call {property.host.role}
              </a>
            ) : (
              <button onClick={() => requireAuth(() => {})}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-neutral-200 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-colors">
                <Phone className="w-4 h-4" /> Call {property.host.role}
              </button>
            )
          )}
          {property.host.phone && (
            isLoggedIn ? (
              <a
                href={`https://wa.me/${property.host.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I'm interested in the property listed on Beta Tenant: ${property.title}. Please share more details.`)}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1eb858] transition-colors"
              >
                {AGENT_WA_SVG} WhatsApp
              </a>
            ) : (
              <button onClick={() => requireAuth(() => {})}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1eb858] transition-colors">
                {AGENT_WA_SVG} WhatsApp
              </button>
            )
          )}
          {property.host.email && !property.host.email.endsWith("@imported.betatenant.local") && (
            <button
              onClick={() => requireAuth(() => router.push("/messages"))}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-bt-primary text-white text-sm font-semibold hover:bg-bt-primary-light transition-colors"
            >
              <MessageSquare className="w-4 h-4" /> Message
            </button>
          )}
          <Link href={profileLink}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-bt-primary/30 bg-bt-primary/5 text-bt-primary text-sm font-semibold hover:bg-bt-primary/10 transition-colors">
            <Briefcase className="w-4 h-4" /> View Profile
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Photo Lightbox ──────────────────────────────────────────────────────────

function PhotoLightbox({
  photos, open, index, onClose, onIndexChange,
}: {
  photos: string[]; open: boolean; index: number;
  onClose: () => void; onIndexChange: (i: number) => void;
}) {
  const thumbsRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const prev = useCallback(() => onIndexChange(index > 0 ? index - 1 : photos.length - 1), [index, photos.length, onIndexChange]);
  const next = useCallback(() => onIndexChange(index < photos.length - 1 ? index + 1 : 0), [index, photos.length, onIndexChange]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, prev, next, onClose]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!open) return;
    const el = thumbsRef.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [index, open]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] bg-black flex flex-col"
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); }
        touchStartX.current = null;
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
        >
          <X className="w-5 h-5" />
          <span className="hidden sm:inline">Close</span>
        </button>
        <span className="text-white/70 text-sm font-medium tabular-nums">
          {index + 1} / {photos.length}
        </span>
        <div className="w-16" />
      </div>

      {/* Main image */}
      <div className="flex-1 relative flex items-center justify-center min-h-0 px-2 sm:px-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="relative w-full h-full"
          >
            <Image
              src={photos[index]}
              alt={`Photo ${index + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </motion.div>
        </AnimatePresence>

        {/* Prev / Next */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 sm:left-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center transition-colors z-10"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 sm:right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center transition-colors z-10"
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="shrink-0 pb-4 pt-3">
          <div
            ref={thumbsRef}
            className="flex gap-2 overflow-x-auto no-scrollbar px-4 justify-center"
          >
            {photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => onIndexChange(i)}
                className={cn(
                  "shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all",
                  i === index ? "border-white scale-110" : "border-transparent opacity-50 hover:opacity-80"
                )}
              >
                <Image src={photo} alt={`Thumb ${i + 1}`} width={64} height={64} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
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
