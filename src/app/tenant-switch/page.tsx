"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Repeat2, Home, ArrowRight, Loader2, Unlock,
  Phone, MessageCircle, Calendar, MapPin, Bed, Bath,
  Eye, CheckCircle, ExternalLink, ChevronDown, Flag,
  Sparkles, AlertCircle, ShieldCheck,
} from "lucide-react";
import { tenantSwitchApi, cdnImg, mapProperty } from "@/lib/api";
import { PropertyCard } from "@/components/property/property-card";
import { useAuthStore } from "@/lib/auth-store";
import { locationData } from "@/lib/locations";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";


function fmt(n: number) { return `₦${n.toLocaleString()}`; }

function daysUntil(d: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

// ── Tenant Switch Card ────────────────────────────────────────────────────────
function TenantSwitchCard({ listing, compact }: {
  listing: any; compact?: boolean;
}) {
  const days = daysUntil(listing.moveOutDate);
  return (
    <Link href={`/property/${listing._id}`}
      className={cn("block bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden hover:shadow-md hover:border-neutral-200 transition-all", compact && "flex gap-0")}>
      <div className={cn("relative bg-neutral-100 shrink-0", compact ? "w-28 h-full" : "h-44")}>
        <Image src={cdnImg(listing.photos[0], 600)} alt={listing.title} fill
          className="object-cover" sizes={compact ? "112px" : "(max-width:640px) 100vw, 400px"} />
        {!compact && days !== null && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-neutral-100 text-xs font-semibold text-neutral-700">
            <Calendar className="w-3 h-3 text-bt-secondary" />
            {days <= 0 ? "Moving soon" : `${days}d`}
          </div>
        )}
        {!compact && listing.tenantGender && listing.tenantGender !== "any" && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-neutral-100 text-xs font-semibold">
            {listing.tenantGender === "male" ? "👨" : "👩"}
          </div>
        )}
        {listing.isUnlocked && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
            <CheckCircle className="w-3 h-3" /> Unlocked
          </div>
        )}
      </div>

      <div className="p-4 flex-1 min-w-0">
        <p className="text-base font-bold text-neutral-900">{fmt(listing.price)}<span className="text-xs font-normal text-neutral-400">/yr</span></p>
        <p className={cn("text-sm text-neutral-600 mt-0.5", compact ? "truncate" : "")}>{listing.title}</p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-400">
          <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />{listing.bedrooms}</span>
          <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{listing.bathrooms}</span>
          <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 shrink-0" />{listing.lga}</span>
          {compact && days !== null && (
            <span className="flex items-center gap-1 text-bt-secondary font-medium">
              <Calendar className="w-3 h-3" />{days <= 0 ? "Soon" : `${days}d`}
            </span>
          )}
        </div>

        {/* Contact preview — blurred until unlocked */}
        <div className={cn("mt-3 rounded-xl border p-3",
          listing.isUnlocked ? "border-emerald-100 bg-emerald-50/50" : "border-neutral-100 bg-neutral-50")}>
          {listing.isUnlocked ? (
            <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Contact unlocked — tap to view &amp; call
            </p>
          ) : (
            <div className="space-y-1.5 select-none pointer-events-none">
              <div className="h-3 rounded-full bg-neutral-200 w-28 blur-[3px]" />
              <div className="h-3 rounded-full bg-neutral-200 w-36 blur-[3px]" />
              <div className="flex gap-2 mt-1.5">
                <div className="flex-1 h-7 rounded-lg bg-neutral-200 blur-[2px]" />
                <div className="flex-1 h-7 rounded-lg bg-neutral-200 blur-[2px]" />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── My Unlock Card ────────────────────────────────────────────────────────────
function MyUnlockCard({ listing }: { listing: any }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 flex items-center gap-4">
      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
        <Image src={cdnImg(listing.photos[0], 200)} alt={listing.title} fill className="object-cover" sizes="64px" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-neutral-900 truncate">{listing.title}</p>
        <p className="text-xs text-neutral-500">{listing.lga}, {listing.state}</p>
        <p className="text-xs font-semibold text-bt-primary mt-0.5">{fmt(listing.price)}/yr</p>
        <div className="flex items-center gap-3 mt-1.5">
          {listing.host.phone && <>
            <a href={`tel:${listing.host.phone}`} className="text-xs text-bt-primary font-semibold flex items-center gap-1">
              <Phone className="w-3 h-3" /> {listing.host.phone}
            </a>
            <a href={`https://wa.me/${listing.host.phone}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-[#25D366] font-semibold">WA</a>
          </>}
        </div>
      </div>
      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
    </div>
  );
}

// ── Location dropdowns ────────────────────────────────────────────────────────
function LocationFilter({ state, lga, onStateChange, onLgaChange }: {
  state: string; lga: string;
  onStateChange: (s: string) => void; onLgaChange: (l: string) => void;
}) {
  const states = locationData.map(d => d.state);
  const lgas   = locationData.find(d => d.state === state)?.cities ?? [];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative">
        <select
          value={state}
          onChange={e => { onStateChange(e.target.value); onLgaChange(""); }}
          className="appearance-none pl-3 pr-8 py-2 rounded-full border border-neutral-200 bg-white text-sm font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all cursor-pointer"
        >
          <option value="">All States</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
      </div>

      {state && (
        <div className="relative">
          <select
            value={lga}
            onChange={e => onLgaChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-full border border-neutral-200 bg-white text-sm font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all cursor-pointer"
          >
            <option value="">All {state}</option>
            {lgas.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
        </div>
      )}

      {(state || lga) && (
        <button
          onClick={() => { onStateChange(""); onLgaChange(""); }}
          className="px-3 py-2 rounded-full border border-neutral-200 bg-white text-xs font-medium text-neutral-500 hover:border-neutral-300 transition-all"
        >
          Clear
        </button>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyLocationState({ state, lga, stateWideResults, isLoggedIn }: {
  state: string; lga: string; stateWideResults: any[];
  isLoggedIn: boolean;
}) {
  const location = lga ? `${lga}, ${state}` : state || "this area";

  return (
    <div className="space-y-6">
      {/* Main message */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-7 h-7 text-amber-500" />
        </div>
        <h3 className="text-base font-bold text-neutral-900 mb-2">
          Nobody in {location} is moving soon
        </h3>
        <p className="text-sm text-neutral-600 max-w-sm mx-auto leading-relaxed">
          No tenant switch listings found here yet.
          {stateWideResults.length > 0
            ? ` But we found ${stateWideResults.length} listing${stateWideResults.length !== 1 ? "s" : ""} by tenants in ${state} — check them out below.`
            : " Check back later or browse all listings."}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-5">
          {isLoggedIn && (
            <Link href="/tenant-switch/list"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-bt-primary text-white text-sm font-semibold hover:bg-bt-primary-light transition-colors">
              <Home className="w-4 h-4" /> List My Space Here
            </Link>
          )}
          <Link href="/properties"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-neutral-200 bg-white text-sm font-medium text-neutral-700 hover:border-neutral-300 transition-all">
            Browse All Properties
          </Link>
          <Link href="/report"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-neutral-200 bg-white text-sm font-medium text-neutral-500 hover:border-neutral-300 transition-all">
            <Flag className="w-3.5 h-3.5" /> Report an Issue
          </Link>
        </div>
      </div>

      {/* Promotional package reminder */}
      <div className="bg-gradient-to-br from-bt-primary/5 to-bt-secondary/5 border border-bt-primary/10 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-bt-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-bt-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-neutral-900 mb-1">Agents &amp; landlords — get more eyes here</p>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Boost your listing to appear as a &quot;Similar Property&quot; on Tenant Switch pages.
            Tenants looking to move are actively browsing here — a great opportunity to fill your space.
          </p>
          <Link href="/host/boost"
            className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-bt-primary hover:underline">
            View Promotional Packages <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Similar listings from same state */}
      {stateWideResults.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-neutral-200" />
            <p className="text-xs font-semibold text-neutral-500 whitespace-nowrap">
              Tenants moving in {state}
            </p>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>
          <div className="space-y-3">
            {stateWideResults.map((l: any) => (
              <TenantSwitchCard key={l._id} listing={l} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function TenantSwitchContent() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab]             = useState<"browse" | "my-unlocks">("browse");
  const [filterState, setFilterState] = useState("");
  const [filterLga, setFilterLga]     = useState("");
  const [moveWithin, setMoveWithin]   = useState("");
  const isLoggedIn = !!token;
  const isUser = !user?.role || user.role === "user";

  const { data, isLoading } = useQuery({
    queryKey: ["tenant-switch-listings", filterState, filterLga, moveWithin],
    queryFn: () => tenantSwitchApi.listings(1, 40, filterState || undefined, filterLga || undefined, moveWithin || undefined),
    staleTime: 1000 * 60 * 2,
  });

  const { data: myListingData } = useQuery({
    queryKey: ["tenant-switch-my-listing"],
    queryFn: tenantSwitchApi.myListing,
    enabled: isLoggedIn && isUser,
    staleTime: 1000 * 60 * 5,
  });
  const myListing = myListingData?.primary;

  const { data: myUnlocks = [], isLoading: loadingUnlocks } = useQuery({
    queryKey: ["tenant-switch-my-unlocks"],
    queryFn: tenantSwitchApi.myUnlocks,
    enabled: isLoggedIn && tab === "my-unlocks",
    staleTime: 1000 * 60 * 2,
  });


  const listings          = data?.listings ?? [];
  const stateWide         = data?.stateWideResults ?? [];
  const boostedSimilar    = data?.boostedSimilar ?? [];
  const noResults         = !isLoading && listings.length === 0;
  const hasLocationFilter = !!(filterState || filterLga);

  return (
    <div className="min-h-screen bg-bt-surface">
      {/* Hero */}
      <div className="bg-white border-b border-neutral-100 py-10 md:py-14">
        <div className="max-w-[720px] mx-auto px-5 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bt-primary/8 text-bt-primary text-sm font-semibold mb-5">
            <Repeat2 className="w-4 h-4" /> Tenant Switch
          </div>
          <h1 className="text-[26px] sm:text-[32px] font-bold text-neutral-900 tracking-[-0.02em] mb-3">
            Find Tenants Ready to Move Out
          </h1>
          <p className="text-neutral-500 leading-relaxed max-w-md mx-auto">
            Connect directly with tenants leaving their space — no agents, no middlemen.
          </p>

          {myListing && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
              <Unlock className="w-4 h-4" />
              You have free unlocks — tap a listing to view contact
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            {isLoggedIn && isUser ? (
              myListing ? (
                <Link href="/tenant-switch/list"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-sm">
                  <Eye className="w-4 h-4" /> View My Space <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link href="/tenant-switch/list"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-bt-primary text-white font-semibold text-sm hover:bg-bt-primary-light transition-colors shadow-[0_2px_8px_rgba(10,8,118,0.2)]">
                  <Home className="w-4 h-4" /> List My Space <ArrowRight className="w-4 h-4" />
                </Link>
              )
            ) : !isLoggedIn ? (
              <Link href="/auth/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-bt-primary text-white font-semibold text-sm">
                Sign in to list your space
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Tabs */}
      {isLoggedIn && (
        <div className="max-w-[1360px] mx-auto px-5 lg:px-10 pt-6">
          <div className="flex items-center gap-1 bg-neutral-100 rounded-full p-1 w-fit">
            <button onClick={() => setTab("browse")}
              className={cn("px-5 py-2 rounded-full text-sm font-semibold transition-all",
                tab === "browse" ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500 hover:text-neutral-700")}>
              Browse Listings
            </button>
            <button onClick={() => setTab("my-unlocks")}
              className={cn("px-5 py-2 rounded-full text-sm font-semibold transition-all",
                tab === "my-unlocks" ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500 hover:text-neutral-700")}>
              My Unlocks
              {(myUnlocks as any[]).length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-bt-primary text-white text-[10px] font-bold">
                  {(myUnlocks as any[]).length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[1360px] mx-auto px-5 lg:px-10 py-6">

        {/* Browse */}
        {tab === "browse" && (
          <>
            {/* Location filter + move-out filter + pricing info */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <LocationFilter
                  state={filterState} lga={filterLga}
                  onStateChange={setFilterState} onLgaChange={setFilterLga}
                />
              </div>
              {/* Move-out date filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-neutral-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Moving out:
                </span>
                {[
                  { label: "Anytime", value: "" },
                  { label: "This week", value: "7" },
                  { label: "This month", value: "30" },
                  { label: "2 months", value: "60" },
                ].map(f => (
                  <button key={f.value} onClick={() => setMoveWithin(f.value)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all",
                      moveWithin === f.value
                        ? "bg-bt-primary text-white border-bt-primary"
                        : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                    )}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
                <span className="px-2.5 py-1 bg-white rounded-lg border border-neutral-100">&lt;₦501k → <b className="text-neutral-700">₦500</b></span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-neutral-100">–₦1.5M → <b className="text-neutral-700">₦850</b></span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-neutral-100">&gt;₦1.5M → <b className="text-neutral-700">₦1,500</b></span>
                <span className="px-2.5 py-1 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-700 font-semibold">List your space → 5 free/mo</span>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-[380px] rounded-2xl bg-neutral-100 animate-pulse" />
                ))}
              </div>
            ) : noResults && hasLocationFilter ? (
              <EmptyLocationState
                state={filterState} lga={filterLga}
                stateWideResults={stateWide}

                isLoggedIn={isLoggedIn}
              />
            ) : noResults ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                  <Repeat2 className="w-7 h-7 text-neutral-300" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">No swap listings yet</h3>
                <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto">Be the first to list your space and get 5 free unlocks a month.</p>
                <Link href={isLoggedIn ? "/tenant-switch/list" : "/auth/login"}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-bt-primary text-white font-semibold text-sm">
                  <Home className="w-4 h-4" /> List My Space
                </Link>
              </div>
            ) : (
              <div className={cn(
                "grid gap-5",
                listings.length === 1 ? "grid-cols-1 max-w-sm" :
                "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              )}>
                {listings.map((l: any) => (
                  <div key={l._id}>
                    <TenantSwitchCard listing={l} />
                  </div>
                ))}
              </div>
            )}

            {/* Boosted agent/landlord similar properties */}
            {!isLoading && boostedSimilar.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-neutral-200" />
                  <div className="flex items-center gap-2 shrink-0">
                    <ShieldCheck className="w-4 h-4 text-bt-secondary" />
                    <p className="text-sm font-bold text-neutral-700">
                      Similar Properties by Agents &amp; Landlords
                      {(filterState || filterLga) && (
                        <span className="font-normal text-neutral-400"> in {filterLga || filterState}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex-1 h-px bg-neutral-200" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {boostedSimilar.map((p: any) => (
                    <div key={p._id} className="relative">
                      {/* Agent / Landlord tag */}
                      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm border border-neutral-100 shadow-sm text-[11px] font-bold text-neutral-700">
                        <ShieldCheck className="w-3 h-3 text-bt-primary" />
                        {p.host?.role === "landlord" ? "Landlord" : "Agent"}
                      </div>
                      <PropertyCard property={p} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* My Unlocks */}
        {tab === "my-unlocks" && (
          <div>
            <h2 className="text-base font-bold text-neutral-900 mb-4">Your Unlocked Contacts</h2>
            {loadingUnlocks ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-neutral-100 animate-pulse" />)}
              </div>
            ) : (myUnlocks as any[]).length > 0 ? (
              <div className="space-y-3">
                {(myUnlocks as any[]).map((l: any) => <MyUnlockCard key={l._id} listing={l} />)}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                  <Unlock className="w-6 h-6 text-neutral-300" />
                </div>
                <p className="text-neutral-500 text-sm">No unlocked contacts yet.</p>
                <button onClick={() => setTab("browse")}
                  className="mt-4 px-5 py-2.5 rounded-full bg-bt-primary text-white text-sm font-semibold">
                  Browse Listings
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TenantSwitchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-bt-primary" /></div>}>
      <TenantSwitchContent />
    </Suspense>
  );
}
