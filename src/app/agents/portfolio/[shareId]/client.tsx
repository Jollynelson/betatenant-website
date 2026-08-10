"use client";

import { use, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Phone, Clock, Star, Home, Globe,
  Zap, ShieldCheck, ArrowLeft, Share2, Crown, Briefcase,
  MessageSquare, Flag, ChevronLeft, ChevronRight, X,
  CornerDownRight, Pencil, Trash2,
  Award, Timer, CheckCircle2, Users,
} from "lucide-react";
import { api, mapProperty } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { PropertyCard } from "@/components/property/property-card";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const WA_ICON = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
);

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  const m = Math.floor(d / 30);
  if (m < 12) return `${m}mo ago`;
  return `${Math.floor(m / 12)}y ago`;
}

const PAGE_SIZE = 20;

export default function AgentPortfolioPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId: paramShareId } = use(params);
  const shareId = typeof window !== "undefined"
    ? window.location.pathname.split("/agents/portfolio/")[1]?.split("/")[0] || paramShareId
    : paramShareId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, user } = useAuthStore();
  const isLoggedIn = !!token;

  const [listingTab, setListingTab] = useState<"all" | "available" | "rent" | "short-let">("all");
  const [listingPage, setListingPage] = useState(1);
  const [reviewFilter, setReviewFilter] = useState("all");
  const [reviewsShown, setReviewsShown] = useState(4);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyEditing, setReplyEditing] = useState<Record<string, string>>({});
  const [showAllAreas, setShowAllAreas] = useState(false);

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["portfolio-profile", shareId],
    queryFn: () => api.get<any>(`/v1/landlordandagent/share/shareid/${shareId}`),
    staleTime: 1000 * 60 * 5,
  });
  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ["portfolio-listings", shareId],
    queryFn: () => api.post<any>(`/v1/landlordandagent/share/properties/${shareId}/1/200`, {}),
    staleTime: 1000 * 60 * 5,
  });

  const profile = profileData?.result;
  const allListings = (listingsData?.properties ?? []).map(mapProperty);
  const isPremium = profile?.userSubscriptionObject?.status === "active";
  const isVerified = profile?.userVerificationObject?.status === "verified";

  const { data: reviewsData } = useQuery({
    queryKey: ["portfolio-reviews", profile?._id],
    queryFn: () => api.get<any>(`/v1/landlordandagent/review/${profile._id}`),
    enabled: !!profile?._id,
    staleTime: 1000 * 60 * 5,
  });

  const reviews: any[] = reviewsData?.reviews ?? reviewsData?.result ?? [];
  const avgRating = reviews.length
    ? reviews.reduce((a: number, r: any) => a + (r.rating ?? 0), 0) / reviews.length
    : (profile?.agentStats?.rating ?? 0);

  // Areas with listing counts from live listings
  const areaStats = useMemo(() => {
    const map: Record<string, number> = {};
    allListings.forEach((p: any) => {
      const key = p.lga || p.area || p.state;
      if (key) map[key] = (map[key] || 0) + 1;
    });
    // Also add profile areas that don't appear in listings
    if (profile?.areasOfOperation) {
      profile.areasOfOperation.forEach((a: string) => {
        const t = a.trim();
        if (t && !map[t]) map[t] = 0;
      });
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([area, count]) => ({ area, count }));
  }, [allListings, profile?.areasOfOperation]);

  const submitReview = useMutation({
    mutationFn: () => api.post<any>("/v1/landlordandagent/review", {
      landlordUserId: profile._id, rating: reviewRating, comment: reviewComment,
    }),
    onSuccess: () => {
      toast.success("Review submitted!");
      setShowReviewModal(false); setReviewRating(0); setReviewComment("");
      queryClient.invalidateQueries({ queryKey: ["portfolio-reviews", profile?._id] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to submit review"),
  });

  const submitReply = useMutation({
    mutationFn: ({ reviewId, text }: { reviewId: string; text: string }) =>
      api.post<any>(`/v1/landlordandagent/review/${reviewId}/reply`, { text }),
    onSuccess: (_, { reviewId }) => {
      toast.success("Reply posted!");
      setReplyDrafts(p => { const n = { ...p }; delete n[reviewId]; return n; });
      setReplyEditing(p => { const n = { ...p }; delete n[reviewId]; return n; });
      queryClient.invalidateQueries({ queryKey: ["portfolio-reviews", profile?._id] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to post reply"),
  });

  const deleteReply = useMutation({
    mutationFn: (reviewId: string) => api.del<any>(`/v1/landlordandagent/review/${reviewId}/reply`),
    onSuccess: () => {
      toast.success("Reply removed");
      queryClient.invalidateQueries({ queryKey: ["portfolio-reviews", profile?._id] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to remove reply"),
  });

  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: `${profile.firstName} — BetaTenant`, url: location.href }); return; } catch {} }
    try { await navigator.clipboard.writeText(location.href); toast.success("Link copied!"); } catch { toast.error("Could not copy"); }
  };

  if (profileLoading) return <Skeleton />;
  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
        <p className="font-medium text-neutral-700 mb-1">Profile not found</p>
        <p className="text-sm text-neutral-400 mb-4">This link may be broken or expired.</p>
        <Link href="/agents" className="text-bt-primary text-sm font-semibold">← Browse agents</Link>
      </div>
    </div>
  );

  const isOwn = isLoggedIn && user?.userId === profile._id;
  const roleLabel = profile.role === "agent" ? "Agent" : "Landlord";
  const waLink = `https://wa.me/${profile.phoneNumber?.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${profile.firstName}, I found your profile on BetaTenant and would like to inquire.`)}`;

  // Listing tabs + counts
  const rentCount     = allListings.filter((p: any) => p.rentType === "rent" || !p.rentType).length;
  const shortLetCount = allListings.filter((p: any) => p.rentType === "short-let").length;
  const activeCount   = allListings.filter((p: any) => p.status === "available").length;

  const tabListings = allListings.filter((p: any) => {
    if (listingTab === "all") return true;
    if (listingTab === "available") return p.status === "available";
    if (listingTab === "rent") return p.rentType === "rent" || !p.rentType;
    if (listingTab === "short-let") return p.rentType === "short-let";
    return true;
  });

  const totalPages   = Math.ceil(tabListings.length / PAGE_SIZE);
  const pagedListings = tabListings.slice((listingPage - 1) * PAGE_SIZE, listingPage * PAGE_SIZE);

  const filteredReviews = reviewFilter === "all" ? reviews
    : reviewFilter === "great"   ? reviews.filter((r: any) => r.rating >= 4)
    : reviewFilter === "average" ? reviews.filter((r: any) => r.rating === 3)
    : reviews.filter((r: any) => r.rating <= 2);

  const AREAS_SHOW = showAllAreas ? areaStats.length : 12;

  const badges = [
    ...(isVerified ? [{ title: "Verified Rental Agent", sub: "ID and rental activity verified", icon: ShieldCheck, c: "text-blue-600 bg-blue-50" }] : []),
    ...(profile?.agentStats?.avgResponseTime != null && profile.agentStats.avgResponseTime < 1800000
      ? [{ title: "Fast Responder", sub: "Responds within 30 minutes", icon: Zap, c: "text-amber-600 bg-amber-50" }] : []),
    ...(avgRating >= 4 && reviews.length >= 2
      ? [{ title: "Top Rated", sub: "Consistently high tenant review", icon: Award, c: "text-emerald-600 bg-emerald-50" }] : []),
  ];

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 lg:pb-0">

      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          <Link href="/agents" className="flex items-center gap-1.5 text-sm text-neutral-600 font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to agents
          </Link>
          <button onClick={share} className="text-neutral-500 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <Share2 className="w-[18px] h-[18px]" />
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* ── Profile card ───────────────────────────────────────── */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className={cn(
                "w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-neutral-100 border",
                isPremium ? "border-amber-400 shadow-[0_0_0_2px_rgba(251,191,36,0.3)]" : "border-neutral-200"
              )}>
                {profile.profilePic
                  ? <Image src={profile.profilePic} alt="" width={96} height={96} className="object-cover w-full h-full" />
                  : <div className="w-full h-full bg-neutral-200 flex items-center justify-center text-neutral-400 text-2xl font-bold">{profile.firstName?.[0]}{profile.lastName?.[0]}</div>
                }
              </div>
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 capitalize leading-tight">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {isVerified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-green-200 bg-green-50 text-green-700 text-xs font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                    {isPremium && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold">
                        <Crown className="w-3 h-3" /> Premium Agent
                      </span>
                    )}
                    {avgRating > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                      </span>
                    )}
                  </div>
                </div>

                {/* Desktop CTAs */}
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  {profile.phoneNumber && (
                    <a href={`tel:${profile.phoneNumber}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-bt-primary text-white text-sm font-semibold hover:bg-bt-primary-light active:scale-[0.97] transition-all">
                      <Phone className="w-4 h-4" /> Call
                    </a>
                  )}
                  {profile.phoneNumber && (
                    <a href={waLink} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1eb858] active:scale-[0.97] transition-all">
                      {WA_ICON} WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* Meta details */}
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-500">
                {profile.agentBasedLocation && (
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" />{profile.agentBasedLocation}</span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  Member since {new Date(profile.createdAt).getFullYear()}
                </span>
                {Number(profile.yearsOfRentalExperience) > 0 && (
                  <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 shrink-0" />{profile.yearsOfRentalExperience}+ years experience</span>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-5 pt-5 border-t border-neutral-100 grid grid-cols-2 sm:grid-cols-4 gap-px bg-neutral-100 rounded-xl overflow-hidden border border-neutral-100">
            {[
              { label: "Active Listings", val: allListings.length || profile?.agentStats?.activeListings || 0 },
              { label: "For Rent", val: rentCount },
              { label: "Short Let", val: shortLetCount },
              { label: "Areas Covered", val: areaStats.length },
            ].map(s => (
              <div key={s.label} className="bg-white py-3 px-4 text-center">
                <p className="text-xl font-bold text-neutral-900">{s.val}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Areas covered ──────────────────────────────────────── */}
        {areaStats.length > 0 && (
          <div className="bg-white border border-neutral-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-neutral-500" />
              <h2 className="text-sm font-semibold text-neutral-900">Areas covered</h2>
              <span className="text-sm text-neutral-400">· {areaStats.length} area{areaStats.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {areaStats.slice(0, AREAS_SHOW).map(({ area, count }) => (
                <span key={area}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200 text-sm text-neutral-700 hover:border-bt-primary/30 hover:bg-bt-primary/5 cursor-pointer transition-colors capitalize">
                  {area}
                  {count > 0 && <span className="text-neutral-400 text-xs">{count}</span>}
                </span>
              ))}
              {areaStats.length > 12 && (
                <button onClick={() => setShowAllAreas(!showAllAreas)}
                  className="px-3 py-1.5 rounded-full border border-neutral-200 text-sm text-bt-primary font-medium hover:bg-bt-primary/5 transition-colors">
                  {showAllAreas ? "Show less" : `+ ${areaStats.length - 12} more areas`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Listings ───────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-neutral-900">
              Listings from {profile.firstName} {profile.lastName}
            </h2>
          </div>
          {!listingsLoading && (
            <p className="text-sm text-neutral-500 mb-3">
              Showing {((listingPage - 1) * PAGE_SIZE) + 1}–{Math.min(listingPage * PAGE_SIZE, tabListings.length)} of {tabListings.length} {listingTab !== "all" ? listingTab : ""} properties
            </p>
          )}

          {/* Tab pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
            {[
              { key: "all",       label: "All",       count: allListings.length },
              { key: "available", label: "Active",    count: activeCount },
              { key: "rent",      label: "For rent",  count: rentCount },
              { key: "short-let", label: "Short let", count: shortLetCount },
            ].map(t => (
              <button key={t.key}
                onClick={() => { setListingTab(t.key as any); setListingPage(1); }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
                  listingTab === t.key
                    ? "bg-bt-primary text-white border-bt-primary"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                )}>
                {t.label}
                <span className={cn("text-xs font-semibold", listingTab === t.key ? "opacity-80" : "text-neutral-400")}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {listingsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-72 rounded-2xl bg-neutral-100 animate-pulse" />)}
            </div>
          ) : pagedListings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pagedListings.map((p: any) => <PropertyCard key={p._id} property={p} />)}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-100">
                  <p className="text-sm text-neutral-500">
                    Showing {((listingPage - 1) * PAGE_SIZE) + 1}–{Math.min(listingPage * PAGE_SIZE, tabListings.length)} of {tabListings.length} listings
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setListingPage(p => Math.max(1, p - 1))}
                      disabled={listingPage === 1}
                      className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 disabled:opacity-30 hover:bg-neutral-50 transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let page = i + 1;
                      if (totalPages > 5) {
                        if (listingPage <= 3) page = i + 1;
                        else if (listingPage >= totalPages - 2) page = totalPages - 4 + i;
                        else page = listingPage - 2 + i;
                      }
                      return (
                        <button key={page}
                          onClick={() => setListingPage(page)}
                          className={cn(
                            "w-8 h-8 rounded-full text-sm font-semibold transition-colors",
                            page === listingPage
                              ? "bg-bt-primary text-white"
                              : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                          )}>
                          {page}
                        </button>
                      );
                    })}
                    {totalPages > 5 && listingPage < totalPages - 2 && (
                      <span className="text-neutral-400 px-1">… {totalPages}</span>
                    )}
                    <button
                      onClick={() => setListingPage(p => Math.min(totalPages, p + 1))}
                      disabled={listingPage === totalPages}
                      className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 disabled:opacity-30 hover:bg-neutral-50 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-14 bg-white rounded-2xl border border-neutral-100">
              <Home className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">No listings in this category.</p>
            </div>
          )}
        </div>

        {/* ── About (at bottom like NPC) ──────────────────────────── */}
        {(profile.about || badges.length > 0) && (
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6">
            <h2 className="text-base font-bold text-neutral-900 mb-3">About {profile.firstName} {profile.lastName}</h2>
            {profile.about && (
              <p className="text-sm text-neutral-600 leading-relaxed">{profile.about}</p>
            )}
            {badges.length > 0 && (
              <div className="mt-4 flex flex-col gap-2.5">
                {badges.map(b => (
                  <div key={b.title} className="flex items-center gap-3">
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", b.c.split(" ")[1])}>
                      <b.icon className={cn("w-4 h-4", b.c.split(" ")[0])} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{b.title}</p>
                      <p className="text-xs text-neutral-500">{b.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Reviews ────────────────────────────────────────────── */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-neutral-900">
              Reviews &amp; Ratings
              {reviews.length > 0 && <span className="ml-2 text-sm font-normal text-neutral-400">({reviews.length})</span>}
            </h2>
            {!isOwn && (
              <button onClick={() => setShowReviewModal(true)}
                className="text-sm font-semibold text-bt-primary flex items-center gap-1.5 hover:underline">
                <Star className="w-3.5 h-3.5" /> Write a Review
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
            {[
              { key: "all",     label: "All",           count: reviews.length },
              { key: "great",   label: "Great (4-5★)",  count: reviews.filter((r: any) => r.rating >= 4).length },
              { key: "average", label: "Average (3★)",  count: reviews.filter((r: any) => r.rating === 3).length },
              { key: "bad",     label: "Bad (1-2★)",    count: reviews.filter((r: any) => r.rating <= 2).length },
            ].map(t => (
              <button key={t.key} onClick={() => setReviewFilter(t.key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap border transition-colors",
                  reviewFilter === t.key ? "bg-bt-primary text-white border-bt-primary" : "bg-white text-neutral-600 border-neutral-200"
                )}>
                {t.label} <span className="opacity-60">{t.count}</span>
              </button>
            ))}
          </div>

          {filteredReviews.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {filteredReviews.slice(0, reviewsShown).map((r: any) => {
                const hasReply    = !!r.reply?.text;
                const isReplyOpen = replyDrafts[r._id] !== undefined;
                const isEditingReply = replyEditing[r._id] !== undefined;
                const reviewerName = `${r.firstName ?? r.reviewer?.firstName ?? "Anonymous"} ${r.lastName ?? r.reviewer?.lastName ?? ""}`.trim();
                return (
                  <div key={r._id} className="py-4 first:pt-0">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-bt-primary/10 flex items-center justify-center text-bt-primary font-bold text-xs shrink-0 overflow-hidden">
                        {r.profilePic
                          ? <Image src={r.profilePic} alt="" width={36} height={36} className="object-cover w-full h-full" />
                          : <span>{(r.firstName?.[0] ?? "?").toUpperCase()}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-neutral-900 capitalize">{reviewerName}</p>
                            <p className="text-[11px] text-neutral-400 uppercase">{r.role ?? "Tenant"} · {timeAgo(r.createdAt)}</p>
                          </div>
                          <div className="flex gap-0.5 shrink-0">
                            {[1,2,3,4,5].map(s => <Star key={s} className={cn("w-3 h-3", s <= r.rating ? "fill-amber-400 text-amber-400" : "text-neutral-200")} />)}
                          </div>
                        </div>
                        {(r.message || r.comment) && (
                          <p className="text-sm text-neutral-600 mt-1.5 leading-relaxed">&ldquo;{r.message || r.comment}&rdquo;</p>
                        )}

                        {isOwn && !hasReply && !isReplyOpen && (
                          <button onClick={() => setReplyDrafts(p => ({ ...p, [r._id]: "" }))}
                            className="mt-2 flex items-center gap-1 text-xs text-bt-primary font-medium">
                            <CornerDownRight className="w-3.5 h-3.5" /> Reply
                          </button>
                        )}
                      </div>
                    </div>

                    {hasReply && !isEditingReply && (
                      <div className="ml-12 mt-3 pl-3 border-l-2 border-bt-primary/20">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[11px] font-semibold text-bt-primary mb-0.5">
                              {profile.firstName} (Agent response)
                            </p>
                            <p className="text-sm text-neutral-600 leading-relaxed">{r.reply.text}</p>
                            {r.reply.repliedAt && <p className="text-[10px] text-neutral-400 mt-1">{timeAgo(r.reply.repliedAt)}</p>}
                          </div>
                          {isOwn && (
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => setReplyEditing(p => ({ ...p, [r._id]: r.reply.text }))} className="text-neutral-400 hover:text-bt-primary">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => deleteReply.mutate(r._id)} className="text-neutral-400 hover:text-red-500">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {isOwn && (isReplyOpen || isEditingReply) && (
                      <div className="ml-12 mt-3 flex gap-2 items-start">
                        <CornerDownRight className="w-4 h-4 text-bt-primary/40 shrink-0 mt-2.5" />
                        <div className="flex-1">
                          <textarea
                            value={isEditingReply ? replyEditing[r._id] : replyDrafts[r._id]}
                            onChange={e => {
                              if (isEditingReply) setReplyEditing(p => ({ ...p, [r._id]: e.target.value }));
                              else setReplyDrafts(p => ({ ...p, [r._id]: e.target.value }));
                            }}
                            placeholder={`Reply to ${reviewerName.split(" ")[0]}...`}
                            rows={2} autoFocus
                            className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm placeholder-neutral-400 focus:outline-none focus:border-bt-primary resize-none"
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              disabled={submitReply.isPending}
                              onClick={() => {
                                const text = isEditingReply ? replyEditing[r._id] : replyDrafts[r._id];
                                if (text?.trim()) submitReply.mutate({ reviewId: r._id, text });
                              }}
                              className="px-4 py-1.5 rounded-full bg-bt-primary text-white text-xs font-semibold disabled:opacity-50">
                              {submitReply.isPending ? "Posting…" : isEditingReply ? "Update" : "Post Reply"}
                            </button>
                            <button
                              onClick={() => {
                                if (isEditingReply) setReplyEditing(p => { const n = {...p}; delete n[r._id]; return n; });
                                else setReplyDrafts(p => { const n = {...p}; delete n[r._id]; return n; });
                              }}
                              className="px-4 py-1.5 rounded-full border border-neutral-200 text-neutral-600 text-xs font-medium">
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredReviews.length > reviewsShown && (
                <button onClick={() => setReviewsShown(n => n + 6)}
                  className="w-full pt-4 text-sm font-semibold text-bt-primary hover:underline">
                  Read All {filteredReviews.length} Reviews
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-400">
              <Star className="w-6 h-6 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No reviews yet.</p>
            </div>
          )}
        </div>

        {/* Report */}
        {!isOwn && (
          <div className="text-center py-2">
            <Link href={`/agents/report?name=${encodeURIComponent(`${profile.firstName} ${profile.lastName}`)}&phone=${encodeURIComponent(profile.phoneNumber ?? "")}&registered=true`}
              className="text-sm text-red-500 font-medium inline-flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5" /> Report Agent
            </Link>
          </div>
        )}
      </div>

      {/* Fixed bottom bar — mobile */}
      {!isOwn && profile.phoneNumber && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-neutral-100 px-4 py-3"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
          <div className="flex gap-2 max-w-2xl mx-auto">
            <a href={`tel:${profile.phoneNumber}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-bt-primary text-white text-sm font-bold active:scale-[0.97] transition-transform">
              <Phone className="w-4 h-4" /> Call
            </a>
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-[#25D366] text-white text-sm font-bold active:scale-[0.97] transition-transform">
              {WA_ICON} WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Review modal */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center"
            onClick={() => setShowReviewModal(false)}>
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-neutral-900">Write a Review</h3>
                <button onClick={() => setShowReviewModal(false)} className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-neutral-500" />
                </button>
              </div>
              {isLoggedIn ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-2">Your Rating</p>
                    <div className="flex gap-1.5">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={() => setReviewRating(s)} className="p-0.5 active:scale-110 transition-transform">
                          <Star className={cn("w-8 h-8", s <= reviewRating ? "fill-amber-400 text-amber-400" : "text-neutral-200")} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                    placeholder={`How was your experience with ${profile.firstName}?`}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm placeholder-neutral-400 focus:outline-none focus:border-bt-primary resize-none" />
                  <button onClick={() => submitReview.mutate()}
                    disabled={reviewRating === 0 || submitReview.isPending}
                    className="w-full py-3 rounded-full bg-bt-primary text-white text-sm font-bold disabled:opacity-50 active:scale-[0.98] transition-transform">
                    {submitReview.isPending ? "Submitting…" : "Submit Review"}
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-neutral-600 mb-4">Sign in to leave a review for {profile.firstName}</p>
                  <Link href="/auth/login" className="inline-block px-6 py-3 rounded-full bg-bt-primary text-white text-sm font-semibold">
                    Sign In
                  </Link>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="h-12 bg-white border-b border-neutral-100" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 animate-pulse">
          <div className="flex gap-4">
            <div className="w-24 h-24 rounded-xl bg-neutral-200 shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-7 bg-neutral-200 rounded w-52" />
              <div className="h-4 bg-neutral-100 rounded w-40" />
              <div className="h-4 bg-neutral-100 rounded w-64" />
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-neutral-100 grid grid-cols-4 gap-px bg-neutral-100 rounded-xl overflow-hidden">
            {[1,2,3,4].map(i => <div key={i} className="bg-white h-16" />)}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-72 rounded-2xl bg-neutral-100 animate-pulse" />)}
        </div>
      </div>
    </div>
  );
}
