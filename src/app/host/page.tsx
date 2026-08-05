"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  Plus, Home, Eye, MessageCircle, Star, MapPin, Clock,
  ShieldCheck, Crown, Zap, ChevronRight, Calendar, Phone,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { useAuthStore } from "@/lib/auth-store";
import { api, mapProperty } from "@/lib/api";
import { formatPriceFullNumber } from "@/lib/constants";
import { PropertyCard } from "@/components/property/property-card";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700",
  booked:    "bg-amber-50 text-amber-700",
  rented:    "bg-blue-50 text-blue-700",
  delisted:  "bg-neutral-100 text-neutral-500",
  draft:     "bg-neutral-100 text-neutral-400",
};

function DashboardContent() {
  const { user } = useAuthStore();
  const [view, setView] = useState<"list" | "grid">("list");

  // Own profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["host-profile"],
    queryFn: () => api.get<any>("/v1/landlordandagent/profile"),
    staleTime: 1000 * 60 * 5,
  });

  // Own listings
  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ["host-listings"],
    queryFn: () => api.post<any>("/v1/landlordandagent/properties/1/50", {}),
    staleTime: 1000 * 60 * 2,
  });

  // Pending bookings
  const { data: bookingsData } = useQuery({
    queryKey: ["host-bookings"],
    queryFn: () => api.get<any>("/v1/landlordandagent/property-bookings/1/20"),
    staleTime: 1000 * 60 * 2,
  });

  const profile = profileData?.profile ?? profileData?.user ?? profileData;
  const rawListings: any[] = listingsData?.properties ?? [];
  const listings = rawListings.map(mapProperty);
  const bookings: any[] = bookingsData?.bookingResult?.docs ?? [];
  const pendingBookings = bookings.filter((b) => b.ticketPaymentStatus === "success" && !b.viewingConfirmed);

  const isPremium = profile?.userSubscriptionObject?.status === "active";
  const isVerified = profile?.userVerificationObject?.status === "verified";
  const initials = user?.fullName
    ? user.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const totalViews = rawListings.reduce((s: number, p: any) => s + (p.totalViews ?? 0), 0);
  const totalListings = listingsData?.totalResults ?? rawListings.length;

  const stats = [
    { label: "Active Listings", value: listingsLoading ? null : String(totalListings),             icon: Home,          color: "bg-bt-primary/8 text-bt-primary" },
    { label: "Total Views",     value: listingsLoading ? null : totalViews.toLocaleString(),        icon: Eye,           color: "bg-amber-50 text-amber-600" },
    { label: "Pending Viewings",value: pendingBookings.length > 0 ? String(pendingBookings.length) : "0", icon: Calendar, color: pendingBookings.length > 0 ? "bg-red-50 text-red-500" : "bg-neutral-50 text-neutral-400" },
    { label: "Rating",          value: profile?.agentStats?.averageRating ? Number(profile.agentStats.averageRating).toFixed(1) : "—", icon: Star, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="min-h-screen bg-bt-surface">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* ── Profile Hero ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          {/* Cover */}
          <div className="h-20 bg-gradient-to-r from-bt-primary to-bt-primary-light relative">
            {isPremium && (
              <span className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/90 text-amber-900 text-[11px] font-bold">
                <Crown className="w-3 h-3" /> Premium
              </span>
            )}
          </div>
          <div className="px-5 pb-5">
            <div className="flex items-end justify-between -mt-8 mb-3">
              <div className="relative">
                {profileLoading ? (
                  <div className="w-16 h-16 rounded-full bg-neutral-200 animate-pulse border-4 border-white" />
                ) : profile?.profilePic ? (
                  <Image src={profile.profilePic} alt="" width={64} height={64}
                    className={cn("w-16 h-16 rounded-full object-cover border-4 border-white shadow", isPremium && "ring-2 ring-amber-400")} />
                ) : (
                  <div className={cn("w-16 h-16 rounded-full bg-bt-primary flex items-center justify-center text-white font-bold text-xl border-4 border-white shadow", isPremium && "ring-2 ring-amber-400")}>
                    {initials}
                  </div>
                )}
                {isVerified && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-bt-success border-2 border-white flex items-center justify-center">
                    <ShieldCheck className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <Link href="/host/new"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-bt-primary text-white text-sm font-semibold hover:bg-bt-primary-light transition-colors">
                <Plus className="w-4 h-4" /> Add Listing
              </Link>
            </div>

            {profileLoading ? (
              <div className="space-y-2">
                <div className="h-5 w-40 bg-neutral-100 animate-pulse rounded" />
                <div className="h-3.5 w-56 bg-neutral-100 animate-pulse rounded" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-neutral-900 capitalize leading-tight">
                    {profile?.firstName} {profile?.lastName}
                  </h1>
                  {isVerified && <span className="text-[11px] font-semibold text-bt-success flex items-center gap-0.5"><ShieldCheck className="w-3 h-3" /> Verified</span>}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                  {profile?.agentBasedLocation && (
                    <span className="text-xs text-neutral-500 flex items-center gap-1"><MapPin className="w-3 h-3 text-neutral-400" />{profile.agentBasedLocation}</span>
                  )}
                  {profile?.createdAt && (
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      Since {new Date(profile.createdAt).toLocaleString("default", { month: "short", year: "numeric" })}
                    </span>
                  )}
                  {profile?.phoneNumber && (
                    <a href={`tel:${profile.phoneNumber}`} className="text-xs text-neutral-500 flex items-center gap-1 hover:text-bt-primary transition-colors">
                      <Phone className="w-3 h-3 text-neutral-400" />{String(profile.phoneNumber).replace(/^234/, "0")}
                    </a>
                  )}
                </div>

                {/* Bio */}
                {profile?.about && (
                  <p className="text-xs text-neutral-500 leading-relaxed mt-2.5 line-clamp-2">{profile.about}</p>
                )}

                {/* Areas of operation */}
                {profile?.areasOfOperation?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {profile.areasOfOperation.slice(0, 5).map((area: string, i: number) => (
                      <span key={i} className="px-2.5 py-0.5 rounded-full bg-bt-primary/8 text-bt-primary text-[11px] font-medium">{area.trim()}</span>
                    ))}
                    {profile.areasOfOperation.length > 5 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-500 text-[11px]">+{profile.areasOfOperation.length - 5} more</span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Stats Grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", s.color.split(" ").filter(c => c.startsWith("bg-")).join(" "))}>
                <s.icon className={cn("w-4 h-4", s.color.split(" ").filter(c => !c.startsWith("bg-")).join(" "))} />
              </div>
              {s.value === null ? (
                <div className="h-7 w-16 bg-neutral-100 animate-pulse rounded mb-1" />
              ) : (
                <p className="text-2xl font-bold text-neutral-900">{s.value}</p>
              )}
              <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Pending Bookings ─────────────────────────────────── */}
        {pendingBookings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <p className="text-sm font-semibold text-amber-800">{pendingBookings.length} pending viewing{pendingBookings.length > 1 ? "s" : ""}</p>
              </div>
              <Link href="/messages" className="text-xs text-amber-700 font-medium underline">View</Link>
            </div>
            <div className="space-y-2">
              {pendingBookings.slice(0, 3).map((b: any, i: number) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5">
                  <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-neutral-900 truncate">
                      {b.propertyId?.houseName ?? "Property viewing"}
                    </p>
                    <p className="text-[11px] text-neutral-400">{b.tenantName ?? "Tenant"} · Awaiting confirmation</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── My Listings ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-50">
            <h2 className="font-bold text-neutral-900">My Listings</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5">
                <button onClick={() => setView("list")} className={cn("px-2.5 py-1 rounded-md text-xs font-medium transition-colors", view === "list" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400")}>List</button>
                <button onClick={() => setView("grid")} className={cn("px-2.5 py-1 rounded-md text-xs font-medium transition-colors", view === "grid" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400")}>Grid</button>
              </div>
              <Link href="/account/properties" className="text-xs text-bt-primary font-semibold">See all</Link>
            </div>
          </div>

          {listingsLoading ? (
            <div className="divide-y divide-neutral-50">
              {[1,2,3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-4">
                  <div className="w-14 h-11 rounded-lg bg-neutral-100 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-neutral-100 animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-neutral-100 animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12 px-5">
              <Home className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
              <p className="text-sm text-neutral-500 mb-4">No listings yet</p>
              <Link href="/host/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-bt-primary text-white text-sm font-semibold">
                <Plus className="w-4 h-4" /> Add First Listing
              </Link>
            </div>
          ) : view === "grid" ? (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {listings.map((p) => <PropertyCard key={p._id} property={p} />)}
            </div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {listings.map((listing) => {
                const status = (listing as any).status ?? "available";
                return (
                  <Link
                    key={listing._id}
                    href={`/property/${listing._id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-neutral-50 transition-colors group"
                  >
                    <div className="w-14 h-11 rounded-lg bg-neutral-100 overflow-hidden shrink-0 relative">
                      <Image src={listing.photos[0] || "/placeholder-property.jpg"} alt={listing.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{listing.title}</p>
                      <p className="text-[11px] text-neutral-400">{listing.lga}, {listing.state}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-neutral-900">{formatPriceFullNumber(listing.price)}</p>
                      <span className={cn("inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize", STATUS_STYLES[status] ?? STATUS_STYLES.available)}>
                        {status}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-400 shrink-0 ml-1" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Quick Actions ─────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: "/host/new",           icon: Plus,           label: "Add Listing" },
            { href: "/messages",           icon: MessageCircle, label: "Messages" },
            { href: "/account/properties", icon: Eye,           label: "All Listings" },
          ].map((a) => (
            <Link key={a.href} href={a.href}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-white border border-neutral-100 shadow-sm hover:border-bt-primary/30 hover:bg-bt-primary/4 active:scale-[0.97] transition-all">
              <a.icon className="w-5 h-5 text-bt-primary" />
              <span className="text-xs font-semibold text-neutral-700">{a.label}</span>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}

export default function HostDashboard() {
  return <AuthGuard><DashboardContent /></AuthGuard>;
}
