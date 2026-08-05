"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin, Phone, Mail, Clock, Star, Eye, Home,
  Zap, ShieldCheck, ArrowLeft, Share2, Crown,
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

  const metrics = [
    { label: "Active Listings", value: profile?.agentStats?.activeListings ?? "—", icon: Home },
    { label: "Total Posted",   value: profile?.agentStats?.totalPosted ?? "—",   icon: Eye },
    { label: "Rating",         value: profile?.agentStats?.rating ? `${Number(profile.agentStats.rating).toFixed(1)}/5` : "—", icon: Star },
    { label: "Response Time",  value: profile?.agentStats?.avgResponseTime != null ? `${Math.round(profile.agentStats.avgResponseTime / 60000)} min` : "—", icon: Zap },
    { label: "Total Views",    value: profile?.agentStats?.totalViews ? new Intl.NumberFormat().format(profile.agentStats.totalViews) : "—", icon: Eye },
  ];

  return (
    <div className="min-h-screen bg-bt-surface">
      {/* Profile hero */}
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-[1360px] mx-auto px-5 lg:px-10 py-8">
          <Link href="/agents" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to agents
          </Link>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 flex-wrap">
            {/* Avatar */}
            <div className="relative shrink-0">
              {profile.profilePic ? (
                <div className={cn("w-24 h-24 rounded-full overflow-hidden border-4 shadow-md", isPremium ? "border-amber-400" : "border-white")}>
                  <Image src={profile.profilePic} alt={profile.firstName} width={96} height={96} className="object-cover w-full h-full" />
                </div>
              ) : (
                <div className={cn("w-24 h-24 rounded-full bg-bt-primary/8 flex items-center justify-center text-bt-primary text-2xl font-bold border-4 shadow-md", isPremium ? "border-amber-400" : "border-white")}>
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </div>
              )}
              {isPremium && (
                <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-200 border-2 border-white flex items-center justify-center">
                  <Crown className="w-4 h-4 text-amber-800" />
                </div>
              )}
            </div>

            {/* Identity */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <h1 className="text-2xl font-bold text-neutral-900 capitalize">
                  {profile.firstName} {profile.lastName}
                </h1>
                {profile.userVerificationObject?.status === "verified" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bt-success/10 text-bt-success text-xs font-semibold">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                )}
                {isPremium && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200">
                    <Crown className="w-3 h-3" /> Premium
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 justify-center sm:justify-start text-sm text-neutral-500 flex-wrap">
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
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap pt-1">
                {/* Only show Message for non-imported accounts */}
                {profile.email && !profile.email.endsWith("@imported.betatenant.local") && (
                  <button
                    onClick={() => isLoggedIn ? router.push("/messages") : router.push("/auth/login")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bt-primary text-white text-sm font-medium hover:bg-bt-primary-light transition-colors"
                  >
                    <Mail className="w-4 h-4" /> Message {profile.role}
                  </button>
                )}
                <a href={`tel:${profile.phoneNumber}`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-100 text-bt-primary text-sm font-medium hover:bg-neutral-200 transition-colors capitalize">
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
              <div key={m.label} className="bg-neutral-50 rounded-xl p-4 flex flex-col gap-2">
                <div className="w-9 h-9 rounded-full bg-bt-secondary/10 flex items-center justify-center">
                  <m.icon className="w-4 h-4 text-bt-secondary" />
                </div>
                <p className="text-xs text-neutral-500">{m.label}</p>
                <p className="text-base font-bold text-bt-primary">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[1360px] mx-auto px-5 lg:px-10 py-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

          {/* About sidebar */}
          <div className="w-full lg:w-[280px] shrink-0 space-y-5">
            <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-5">
              <div>
                <h2 className="text-base font-bold text-neutral-900 mb-2">About the {profile.role}</h2>
                <p className="text-sm text-neutral-500 leading-relaxed">{profile.about || "No bio available."}</p>
              </div>
              {profile.yearsOfRentalExperience && (
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 mb-1">Years of Experience</h3>
                  <p className="text-sm text-neutral-500">{profile.yearsOfRentalExperience}+ years in rental industry</p>
                </div>
              )}
              {profile.areasOfOperation?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 mb-2">Areas of Operation</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.areasOfOperation.map((area: string, i: number) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-bt-primary/8 text-bt-primary text-xs font-medium">
                        {area.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Listings */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-neutral-900 mb-5 tracking-[-0.02em]">Active Listings</h2>
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
                <Home className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                <p className="text-neutral-500 text-sm">No active listings at the moment</p>
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
