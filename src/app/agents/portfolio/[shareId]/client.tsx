"use client";

import { use, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Phone, Mail, Clock, Star, Eye, Home,
  Zap, ShieldCheck, ArrowLeft, Share2, Crown, BadgeCheck, Briefcase,
  ChevronLeft, ChevronRight, MessageSquare, Flag, Ban,
} from "lucide-react";
import { api, mapProperty } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { PropertyCard } from "@/components/property/property-card";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const WHATSAPP_SVG = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d} days ago`;
  const m = Math.floor(d / 30);
  if (m < 12) return `${m} month${m > 1 ? "s" : ""} ago`;
  const y = Math.floor(m / 12);
  return `${y} year${y > 1 ? "s" : ""} ago`;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="p-0.5 focus:outline-none"
          aria-label={`${s} star${s > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              "w-6 h-6 transition-colors",
              s <= (hover || value) ? "fill-amber-400 text-amber-400" : "text-neutral-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: any }) {
  return (
    <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 space-y-2">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-bt-primary/10 flex items-center justify-center text-bt-primary font-bold text-sm shrink-0 overflow-hidden">
          {review.reviewer?.profilePic ? (
            <Image src={review.reviewer.profilePic} alt="" width={36} height={36} className="object-cover w-full h-full" />
          ) : (
            <span>{(review.reviewer?.firstName?.[0] ?? "?")}{(review.reviewer?.lastName?.[0] ?? "")}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-900 truncate capitalize">
            {review.reviewer?.firstName ?? "Anonymous"} {review.reviewer?.lastName ?? ""}
          </p>
          <p className="text-xs text-neutral-400">{timeAgo(review.createdAt)}</p>
        </div>
        <div className="flex gap-0.5 shrink-0">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={cn("w-3 h-3", s <= review.rating ? "fill-amber-400 text-amber-400" : "text-neutral-200")} />
          ))}
        </div>
      </div>
      {review.comment && (
        <p className="text-sm text-neutral-600 leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
}

export default function AgentPortfolioPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId: paramShareId } = use(params);
  const shareId = typeof window !== "undefined"
    ? window.location.pathname.split("/agents/portfolio/")[1]?.split("/")[0] || paramShareId
    : paramShareId;
  const router = useRouter();
  const { token, user } = useAuthStore();
  const isLoggedIn = !!token;

  // Listings carousel state
  const carouselRef = useRef<HTMLDivElement>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);

  // Listings filter
  const TYPE_FILTERS = [
    { key: "all", label: "All" },
    { key: "available", label: "Active" },
    { key: "self-contained", label: "Self Contained" },
    { key: "mini-flat/one-bedroom", label: "1 Bed" },
    { key: "two-bedroom", label: "2 Bed" },
    { key: "three-bedroom", label: "3 Bed" },
  ];
  const [listingFilter, setListingFilter] = useState("all");

  // Review state
  const [reviewFilter, setReviewFilter] = useState(0); // 0 = all
  const [reviewsShown, setReviewsShown] = useState(6);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");

  // Block dialog
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["portfolio-profile", shareId],
    queryFn: () => api.get<any>(`/v1/landlordandagent/share/shareid/${shareId}`),
    staleTime: 1000 * 60 * 5,
  });

  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ["portfolio-listings", shareId],
    queryFn: () => api.post<any>(`/v1/landlordandagent/share/properties/${shareId}/1/50`, {}),
    staleTime: 1000 * 60 * 5,
  });

  const profile = profileData?.result;
  const allListings = (listingsData?.properties ?? []).map(mapProperty);
  const isPremium = profile?.userSubscriptionObject?.status === "active";
  const isVerified = profile?.userVerificationObject?.status === "verified";

  // Reviews query — needs profile._id, enabled only when available
  const { data: reviewsData } = useQuery({
    queryKey: ["portfolio-reviews", profile?._id],
    queryFn: () => api.get<any>(`/v1/landlordandagent/review/${profile._id}`),
    enabled: !!profile?._id,
    staleTime: 1000 * 60 * 5,
  });

  const reviews: any[] = reviewsData?.reviews ?? reviewsData?.result ?? [];
  const avgRating = reviews.length
    ? reviews.reduce((acc: number, r: any) => acc + (r.rating ?? 0), 0) / reviews.length
    : (profile?.agentStats?.rating ?? 0);

  const submitReviewMutation = useMutation({
    mutationFn: () => api.post<any>("/v1/landlordandagent/review", {
      landlordUserId: profile._id,
      rating: reviewRating,
      comment: reviewComment,
    }),
    onSuccess: () => {
      toast.success("Review submitted!");
      setReviewFormOpen(false);
      setReviewRating(0);
      setReviewComment("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to submit review"),
  });

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Portfolio link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  if (profileLoading) return <PortfolioSkeleton />;

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-neutral-500 mb-3">Agent profile not found</p>
        <Link href="/agents" className="text-bt-primary text-sm font-medium underline">Back to agents</Link>
      </div>
    </div>
  );

  const isOwnProfile = isLoggedIn && user?.userId && (profile._id === user.userId);

  // Filter listings
  const filteredListings = allListings.filter((p: any) => {
    if (listingFilter === "all") return true;
    if (listingFilter === "available") return p.status === "available";
    return p.apartmentType === listingFilter;
  });

  // Filter reviews
  const filteredReviews = reviewFilter === 0
    ? reviews
    : reviews.filter((r: any) => r.rating === reviewFilter);

  // Carousel scroll helpers
  const CARD_W = 280 + 16; // approx card width + gap
  const scrollCarousel = (dir: "prev" | "next") => {
    const el = carouselRef.current;
    if (!el) return;
    const maxIdx = Math.max(0, filteredListings.length - 4);
    const next = dir === "next" ? Math.min(carouselIdx + 1, maxIdx) : Math.max(carouselIdx - 1, 0);
    setCarouselIdx(next);
    el.scrollTo({ left: next * CARD_W, behavior: "smooth" });
  };

  const metrics = [
    { label: "Active Listings", value: profile?.agentStats?.activeListings ?? "—",       color: "text-blue-600",    bg: "bg-blue-50",    icon: Home },
    { label: "Total Posted",    value: profile?.agentStats?.totalPosted ?? "—",           color: "text-emerald-600", bg: "bg-emerald-50", icon: Briefcase },
    { label: "Rating",          value: avgRating ? `${Number(avgRating).toFixed(1)}/5` : "—", color: "text-amber-500",   bg: "bg-amber-50",   icon: Star },
    { label: "Response Time",   value: profile?.agentStats?.avgResponseTime != null ? `${Math.round(profile.agentStats.avgResponseTime / 60000)} min` : "—", color: "text-bt-primary", bg: "bg-bt-primary/8", icon: Zap },
    { label: "Total Views",     value: profile?.agentStats?.totalViews ? new Intl.NumberFormat().format(profile.agentStats.totalViews) : "—", color: "text-neutral-600", bg: "bg-neutral-100", icon: Eye },
  ];

  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r: any) => r.rating === s).length,
  }));

  return (
    <div className="min-h-screen bg-bt-surface">

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-neutral-100 overflow-hidden">
        {/* Gradient cover */}
        <div className="h-[130px] bg-gradient-to-br from-bt-primary via-[#1a1a8c] to-bt-primary-light relative">
          <div className="max-w-[1360px] mx-auto px-5 lg:px-10">
            <Link href="/agents" className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white pt-4">
              <ArrowLeft className="w-4 h-4" /> Back to agents
            </Link>
          </div>
          {isPremium && (
            <span className="absolute top-4 right-5 lg:right-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/90 text-amber-900 text-[11px] font-bold">
              <Crown className="w-3 h-3" /> Premium
            </span>
          )}
        </div>

        <div className="max-w-[1360px] mx-auto px-5 lg:px-10 pb-8">
          <div className="flex flex-col sm:flex-row items-end sm:items-end gap-4 sm:gap-6 -mt-14 flex-wrap">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className={cn(
                "w-[100px] h-[100px] rounded-full border-4 border-white shadow-xl overflow-hidden",
                isPremium ? "ring-[3px] ring-amber-400 ring-offset-2" : ""
              )}>
                {profile.profilePic ? (
                  <Image src={profile.profilePic} alt={profile.firstName} width={100} height={100} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-bt-primary/10 flex items-center justify-center text-bt-primary text-3xl font-bold">
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </div>
                )}
              </div>
              {isVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-md">
                  <BadgeCheck className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Identity + actions */}
            <div className="flex-1 text-left space-y-1.5 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className={cn("text-2xl font-bold capitalize leading-tight", isPremium ? "text-amber-700" : "text-neutral-900")}>
                  {profile.firstName} {profile.lastName}
                </h1>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                    <BadgeCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
                {isPremium && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold">
                    <Crown className="w-3 h-3 fill-amber-700" /> Premium
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-neutral-500 flex-wrap">
                {profile.agentBasedLocation && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-bt-primary" />
                    {profile.agentBasedLocation}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-bt-primary" />
                  Joined {new Date(profile.createdAt).toLocaleString("default", { month: "long", year: "numeric" })}
                </span>
                {avgRating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-neutral-700">{Number(avgRating).toFixed(1)}</span>
                    <span className="text-neutral-400">({reviews.length} reviews)</span>
                  </span>
                )}
              </div>

              {/* CTA buttons */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {profile.email && !profile.email.endsWith("@imported.betatenant.local") && (
                  <button
                    onClick={() => isLoggedIn ? router.push("/messages") : router.push("/auth/login")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bt-primary text-white text-sm font-semibold hover:bg-bt-primary-light transition-colors shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" /> Message {profile.role}
                  </button>
                )}
                {profile.phoneNumber && (
                  <>
                    <a href={`tel:${profile.phoneNumber}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-100 text-neutral-800 text-sm font-semibold hover:bg-neutral-200 transition-colors capitalize">
                      <Phone className="w-4 h-4 text-bt-primary" /> Call
                    </a>
                    <a
                      href={`https://wa.me/${profile.phoneNumber.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${profile.firstName}, I found your profile on BetaTenant and would like to connect.`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1eb858] transition-colors"
                    >
                      {WHATSAPP_SVG} WhatsApp
                    </a>
                  </>
                )}
                <button onClick={handleShare}
                  className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors"
                  aria-label="Share portfolio">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-8">
            {metrics.map((m) => (
              <div key={m.label} className="bg-neutral-50 rounded-xl p-4 flex flex-col gap-2 border border-neutral-100 hover:border-neutral-200 transition-colors">
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", m.bg)}>
                  <m.icon className={cn("w-4 h-4", m.color)} />
                </div>
                <p className={cn("text-2xl font-bold leading-none", m.color)}>{m.value}</p>
                <p className="text-xs text-neutral-500">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BODY ──────────────────────────────────────────────────────────────── */}
      <div className="max-w-[1360px] mx-auto px-5 lg:px-10 py-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

          {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
          <div className="w-full lg:w-[280px] shrink-0 space-y-4">

            {/* About */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900 mb-2">About the {profile.role}</h2>
                <p className="text-sm text-neutral-500 leading-relaxed">{profile.about || "No bio available."}</p>
              </div>
              {profile.yearsOfRentalExperience && (
                <div className="flex items-center gap-3 pt-3 border-t border-neutral-50">
                  <div className="w-9 h-9 rounded-xl bg-bt-primary/8 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4 text-bt-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">Experience</p>
                    <p className="text-sm font-semibold text-neutral-900">{profile.yearsOfRentalExperience}+ years</p>
                  </div>
                </div>
              )}
              {profile.areasOfOperation?.length > 0 && (
                <div className="pt-3 border-t border-neutral-50">
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Areas of Operation</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.areasOfOperation.map((area: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 rounded-full bg-bt-primary/8 text-bt-primary text-xs font-medium">{area.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              {profile.specializations?.length > 0 && (
                <div className="pt-3 border-t border-neutral-50">
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Specializations</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.specializations.map((spec: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">{spec.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Trust card */}
            <div className={cn(
              "rounded-2xl border p-4 space-y-3",
              isVerified ? "bg-blue-50 border-blue-200" : "bg-neutral-50 border-neutral-200"
            )}>
              <div className="flex items-start gap-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", isVerified ? "bg-blue-600" : "bg-neutral-300")}>
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className={cn("text-sm font-bold", isVerified ? "text-blue-800" : "text-neutral-600")}>
                    {isVerified ? "ID Verified" : "Not Yet Verified"}
                  </p>
                  <p className={cn("text-xs mt-0.5", isVerified ? "text-blue-600" : "text-neutral-400")}>
                    {isVerified ? "BetaTenant confirmed this agent's identity" : "Identity not yet verified on BetaTenant"}
                  </p>
                </div>
              </div>
              {isPremium && (
                <div className="flex items-center gap-3 pt-3 border-t border-amber-200">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
                    <Crown className="w-4 h-4 text-amber-900 fill-amber-900" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-900">Premium Agent</p>
                    <p className="text-xs text-amber-700 mt-0.5">Active premium subscription</p>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile-only contact */}
            <div className="lg:hidden bg-white rounded-2xl border border-neutral-100 p-4 space-y-2.5">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Contact</h3>
              {profile.phoneNumber && (
                <a href={`tel:${profile.phoneNumber}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-neutral-100 text-neutral-800 text-sm font-semibold hover:bg-neutral-200 transition-colors">
                  <Phone className="w-4 h-4 text-bt-primary" /> Call {profile.role}
                </a>
              )}
              {profile.phoneNumber && (
                <a href={`https://wa.me/${profile.phoneNumber.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${profile.firstName}, I found your profile on BetaTenant.`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1eb858] transition-colors">
                  {WHATSAPP_SVG} WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* ── MAIN COLUMN ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-10">

            {/* ── REVIEWS ─────────────────────────────────────────────── */}
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-[-0.02em] mb-5">
                Reviews
                {reviews.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-neutral-400">({reviews.length})</span>
                )}
              </h2>

              {/* Rating summary */}
              {reviews.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-5 mb-6 p-5 bg-white rounded-2xl border border-neutral-100">
                  {/* Big average */}
                  <div className="flex flex-col items-center justify-center gap-1 sm:pr-6 sm:border-r border-neutral-100 min-w-[110px]">
                    <p className="text-5xl font-bold text-neutral-900">{Number(avgRating).toFixed(1)}</p>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cn("w-4 h-4", s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-neutral-200")} />
                      ))}
                    </div>
                    <p className="text-xs text-neutral-400">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
                  </div>
                  {/* Bar breakdown */}
                  <div className="flex-1 space-y-1.5">
                    {starCounts.map(({ star, count }) => (
                      <button
                        key={star}
                        onClick={() => setReviewFilter(reviewFilter === star ? 0 : star)}
                        className={cn(
                          "w-full flex items-center gap-2 group transition-colors",
                          reviewFilter === star ? "opacity-100" : "opacity-80 hover:opacity-100"
                        )}
                      >
                        <span className="text-xs text-neutral-500 w-4 shrink-0">{star}</span>
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                        <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-400 transition-all"
                            style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : "0%" }}
                          />
                        </div>
                        <span className="text-xs text-neutral-400 w-5 shrink-0 text-right">{count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Filter tabs */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                {[{ key: 0, label: "All" }, ...starCounts.map((s) => ({ key: s.star, label: `${s.star}★` }))].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setReviewFilter(tab.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                      reviewFilter === tab.key
                        ? "bg-bt-primary text-white"
                        : "bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Review list */}
              {filteredReviews.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredReviews.slice(0, reviewsShown).map((r: any) => (
                      <ReviewCard key={r._id} review={r} />
                    ))}
                  </div>
                  {filteredReviews.length > reviewsShown && (
                    <button
                      onClick={() => setReviewsShown((n) => n + 6)}
                      className="mt-4 w-full py-3 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
                    >
                      Show more reviews
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-10 bg-white rounded-2xl border border-neutral-100">
                  <Star className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">No reviews yet for this {profile.role}.</p>
                </div>
              )}

              {/* Submit review */}
              {isLoggedIn && !isOwnProfile && (
                <div className="mt-4">
                  {reviewFormOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4"
                    >
                      <h3 className="text-base font-bold text-neutral-900">Write a Review</h3>
                      <div>
                        <p className="text-sm text-neutral-600 mb-2">Your rating</p>
                        <StarPicker value={reviewRating} onChange={setReviewRating} />
                      </div>
                      <div>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder={`Share your experience with ${profile.firstName}...`}
                          rows={3}
                          className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-bt-primary/30 focus:border-bt-primary resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => submitReviewMutation.mutate()}
                          disabled={reviewRating === 0 || submitReviewMutation.isPending}
                          className="flex-1 py-2.5 rounded-full bg-bt-primary text-white text-sm font-semibold hover:bg-bt-primary-light transition-colors disabled:opacity-50"
                        >
                          {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                        </button>
                        <button
                          onClick={() => setReviewFormOpen(false)}
                          className="px-4 py-2.5 rounded-full border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <button
                      onClick={() => setReviewFormOpen(true)}
                      className="w-full py-3 rounded-xl border border-bt-primary/30 bg-bt-primary/5 text-bt-primary text-sm font-semibold hover:bg-bt-primary/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <Star className="w-4 h-4" /> Write a Review
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── LISTINGS ────────────────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-xl font-bold text-neutral-900 tracking-[-0.02em]">
                  {profile.firstName}&apos;s Listings
                  {!listingsLoading && (
                    <span className="ml-2 px-2.5 py-0.5 rounded-full bg-bt-primary/8 text-bt-primary text-sm font-bold">{filteredListings.length}</span>
                  )}
                </h2>
                {filteredListings.length > 4 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => scrollCarousel("prev")}
                      disabled={carouselIdx === 0}
                      className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 transition-colors"
                      aria-label="Previous listings"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => scrollCarousel("next")}
                      disabled={carouselIdx >= filteredListings.length - 4}
                      className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 transition-colors"
                      aria-label="Next listings"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Filter tabs */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                {TYPE_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => { setListingFilter(f.key); setCarouselIdx(0); }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                      listingFilter === f.key
                        ? "bg-bt-primary text-white"
                        : "bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {listingsLoading ? (
                <div className="flex gap-4 overflow-hidden">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="w-[280px] h-[300px] rounded-xl bg-neutral-100 animate-pulse shrink-0" />
                  ))}
                </div>
              ) : filteredListings.length > 0 ? (
                <div
                  ref={carouselRef}
                  className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2"
                  style={{ scrollSnapType: "x mandatory" }}
                >
                  {filteredListings.map((p: any) => (
                    <div key={p._id} className="w-[280px] sm:w-[300px] shrink-0" style={{ scrollSnapAlign: "start" }}>
                      <PropertyCard property={p} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-14 bg-white rounded-2xl border border-neutral-100">
                  <Home className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">No listings match this filter.</p>
                </div>
              )}
            </div>

            {/* ── BOTTOM ACTIONS ──────────────────────────────────────── */}
            {!isOwnProfile && (
              <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
                <Link
                  href={`/agents/report?name=${encodeURIComponent(`${profile.firstName} ${profile.lastName}`)}&phone=${encodeURIComponent(profile.phoneNumber ?? "")}&registered=true`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  <Flag className="w-4 h-4" /> Report {profile.firstName}
                </Link>
                <button
                  onClick={() => setBlockDialogOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-neutral-200 text-neutral-600 text-sm font-medium hover:bg-neutral-50 transition-colors"
                >
                  <Ban className="w-4 h-4" /> Block {profile.firstName}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Block confirmation dialog */}
      <AnimatePresence>
        {blockDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setBlockDialogOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <Ban className="w-6 h-6 text-neutral-500" />
              </div>
              <h3 className="text-base font-bold text-neutral-900 text-center mb-2">Block {profile.firstName}?</h3>
              <p className="text-sm text-neutral-500 text-center mb-5">
                You will no longer see {profile.firstName}&apos;s listings or profile.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setBlockDialogOpen(false);
                    toast.success(`${profile.firstName} has been blocked.`);
                  }}
                  className="flex-1 py-2.5 rounded-full bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 transition-colors"
                >
                  Block
                </button>
                <button
                  onClick={() => setBlockDialogOpen(false)}
                  className="flex-1 py-2.5 rounded-full border border-neutral-200 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="min-h-screen bg-bt-surface">
      <div className="bg-white border-b border-neutral-100">
        <div className="h-[130px] bg-neutral-100 animate-pulse" />
        <div className="max-w-[1360px] mx-auto px-5 lg:px-10 py-8">
          <div className="flex gap-6 items-center -mt-14">
            <div className="w-[100px] h-[100px] rounded-full bg-neutral-200 animate-pulse shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-7 bg-neutral-100 rounded-lg animate-pulse w-48" />
              <div className="h-4 bg-neutral-100 rounded-lg animate-pulse w-64" />
              <div className="h-9 bg-neutral-100 rounded-full animate-pulse w-40" />
            </div>
          </div>
          <div className="grid grid-cols-5 gap-3 mt-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[88px] rounded-xl bg-neutral-100 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
