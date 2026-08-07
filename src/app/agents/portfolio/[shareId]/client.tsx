"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin, Phone, Mail, Clock, Star, Eye, Home,
  Zap, ShieldCheck, ArrowLeft, Share2, Crown, BadgeCheck, Briefcase,
} from "lucide-react";
import { api, mapProperty } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { PropertyCard } from "@/components/property/property-card";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AgentPortfolioPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId: paramShareId } = use(params);
  const shareId = typeof window !== "undefined"
    ? window.location.pathname.split("/agents/portfolio/")[1]?.split("/")[0] || paramShareId
    : paramShareId;
  const router = useRouter();
  const { token } = useAuthStore();
  const isLoggedIn = !!token;

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
  const listings = (listingsData?.properties ?? []).map(mapProperty);
  const isPremium = profile?.userSubscriptionObject?.status === "active";

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
        <Link href="/agents" className="text-bt-primary text-sm font-medium underline">← Back to agents</Link>
      </div>
    </div>
  );

  const isVerified = profile?.userVerificationObject?.status === "verified";

  const metrics = [
    { label: "Active Listings", value: profile?.agentStats?.activeListings ?? "—", icon: Home,  iconColor: "text-blue-500",    bgColor: "bg-blue-50" },
    { label: "Rating",         value: profile?.agentStats?.rating ? `${Number(profile.agentStats.rating).toFixed(1)}/5` : "—", icon: Star, iconColor: "text-amber-500", bgColor: "bg-amber-50" },
    { label: "Total Views",    value: profile?.agentStats?.totalViews ? new Intl.NumberFormat().format(profile.agentStats.totalViews) : "—", icon: Eye, iconColor: "text-neutral-500", bgColor: "bg-neutral-100" },
    { label: "Response Time",  value: profile?.agentStats?.avgResponseTime != null ? `${Math.round(profile.agentStats.avgResponseTime / 60000)} min` : "—", icon: Zap, iconColor: "text-bt-primary", bgColor: "bg-bt-primary/8" },
    { label: "Total Posted",   value: profile?.agentStats?.totalPosted ?? "—",   icon: Briefcase, iconColor: "text-emerald-600", bgColor: "bg-emerald-50" },
  ];

  return (
    <div className="min-h-screen bg-bt-surface">
      {/* Profile hero */}
      <div className="bg-white border-b border-neutral-100 overflow-hidden">
        {/* Gradient cover banner */}
        <div className="h-[120px] bg-gradient-to-br from-bt-primary via-[#1a1a8c] to-bt-primary-light relative">
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
          <div className="flex flex-col sm:flex-row items-end sm:items-end gap-4 sm:gap-6 -mt-12 flex-wrap">
            {/* Avatar */}
            <div className="relative shrink-0">
              {profile.profilePic ? (
                <div className={cn(
                  "w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg",
                  isPremium ? "ring-2 ring-amber-400 ring-offset-2" : ""
                )}>
                  <Image src={profile.profilePic} alt={profile.firstName} width={96} height={96} className="object-cover w-full h-full" />
                </div>
              ) : (
                <div className={cn(
                  "w-24 h-24 rounded-full bg-bt-primary/8 flex items-center justify-center text-bt-primary text-2xl font-bold border-4 border-white shadow-lg",
                  isPremium ? "ring-2 ring-amber-400 ring-offset-2" : ""
                )}>
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </div>
              )}
              {isVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow">
                  <BadgeCheck className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Identity */}
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
              </div>
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {profile.email && !profile.email.endsWith("@imported.betatenant.local") && (
                  <button
                    onClick={() => isLoggedIn ? router.push("/messages") : router.push("/auth/login")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bt-primary text-white text-sm font-semibold hover:bg-bt-primary-light transition-colors shadow-sm"
                  >
                    <Mail className="w-4 h-4" /> Message {profile.role}
                  </button>
                )}
                <a href={`tel:${profile.phoneNumber}`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-100 text-bt-primary text-sm font-semibold hover:bg-neutral-200 transition-colors capitalize">
                  <Phone className="w-4 h-4" /> Call {profile.role}
                </a>
                <button onClick={handleShare} className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors" aria-label="Share portfolio">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-8">
            {metrics.map((m) => (
              <div key={m.label} className="bg-neutral-50 rounded-xl p-4 flex flex-col gap-2 border border-neutral-100 hover:border-neutral-200 transition-colors">
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", m.bgColor)}>
                  <m.icon className={cn("w-4 h-4", m.iconColor)} />
                </div>
                <p className="text-xl font-bold text-neutral-900 leading-none">{m.value}</p>
                <p className="text-xs text-neutral-500">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[1360px] mx-auto px-5 lg:px-10 py-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

          {/* About sidebar */}
          <div className="w-full lg:w-[280px] shrink-0 space-y-4">
            {/* Bio */}
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
                      <span key={i} className="px-2.5 py-1 rounded-full bg-bt-primary/8 text-bt-primary text-xs font-medium">
                        {area.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.specializations?.length > 0 && (
                <div className="pt-3 border-t border-neutral-50">
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Specializations</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.specializations.map((spec: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                        {spec.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Verification status card */}
            <div className={cn(
              "rounded-2xl border p-4 flex items-start gap-3",
              isVerified ? "bg-blue-50 border-blue-200" : "bg-neutral-50 border-neutral-200"
            )}>
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", isVerified ? "bg-blue-600" : "bg-neutral-300")}>
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className={cn("text-sm font-bold", isVerified ? "text-blue-800" : "text-neutral-600")}>
                  {isVerified ? "Identity Verified" : "Not Yet Verified"}
                </p>
                <p className={cn("text-xs mt-0.5", isVerified ? "text-blue-600" : "text-neutral-400")}>
                  {isVerified ? "BetaTenant confirmed this agent's identity" : "Identity not yet verified on BetaTenant"}
                </p>
              </div>
            </div>

            {/* Premium badge */}
            {isPremium && (
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 flex items-center gap-3">
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

          {/* Listings */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-xl font-bold text-neutral-900 tracking-[-0.02em]">Active Listings</h2>
              {!listingsLoading && (
                <span className="px-2.5 py-0.5 rounded-full bg-bt-primary/8 text-bt-primary text-sm font-bold">
                  {listings.length}
                </span>
              )}
            </div>
            {listingsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[300px] rounded-xl bg-neutral-100 animate-pulse" />
                ))}
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {listings.map((p: any) => (
                  <PropertyCard key={p._id} property={p} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-neutral-100">
                <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center mx-auto mb-4 border border-neutral-100">
                  <Home className="w-7 h-7 text-neutral-300" />
                </div>
                <p className="text-neutral-700 font-semibold text-sm mb-1">No active listings</p>
                <p className="text-neutral-400 text-xs">This {profile.role} has no active listings at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="min-h-screen bg-bt-surface">
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-[1360px] mx-auto px-5 lg:px-10 py-8">
          <div className="flex gap-6 items-center">
            <div className="w-24 h-24 rounded-full bg-neutral-100 animate-pulse" />
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
