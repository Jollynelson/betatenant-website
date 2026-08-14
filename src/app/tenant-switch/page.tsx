"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Repeat2, Home, ArrowRight, Loader2, Lock, Unlock,
  Phone, MessageCircle, Calendar, MapPin, Bed, Bath,
  Eye, CheckCircle, ExternalLink,
} from "lucide-react";
import { tenantSwitchApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { cdnImg } from "@/lib/api";

declare const window: Window & { PaystackPop: any };

const PAYSTACK_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "";

function loadPaystack() {
  if (!document.querySelector('script[src*="paystack.co/v2/inline"]')) {
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v2/inline.js";
    document.head.appendChild(s);
  }
}

function formatNaira(n: number) {
  return `₦${n.toLocaleString()}`;
}

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── Tenant Switch Card ────────────────────────────────────────────────────────
function TenantSwitchCard({ listing, onUnlock }: { listing: any; onUnlock: (id: string) => void }) {
  const days = daysUntil(listing.moveOutDate);

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
      {/* Photo */}
      <div className="relative h-44 bg-neutral-100">
        <Image
          src={cdnImg(listing.photos[0], 600)}
          alt={listing.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 400px"
        />
        {/* Move-out badge */}
        {days !== null && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-neutral-100 text-xs font-semibold text-neutral-700">
            <Calendar className="w-3 h-3 text-bt-secondary" />
            {days <= 0 ? "Moving out soon" : days === 1 ? "Moving out tomorrow" : `Moves out in ${days}d`}
          </div>
        )}
        {/* Gender badge */}
        {listing.tenantGender && listing.tenantGender !== "any" && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-neutral-100 text-xs font-semibold text-neutral-700">
            {listing.tenantGender === "male" ? "👨 Male" : "👩 Female"}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-lg font-bold text-neutral-900">{formatNaira(listing.price)}<span className="text-sm font-normal text-neutral-400">/yr</span></p>
        <p className="text-sm text-neutral-600 mt-0.5 truncate">{listing.title}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
          <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />{listing.bedrooms} bed</span>
          <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{listing.bathrooms} bath</span>
          <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 shrink-0" />{listing.lga}, {listing.state}</span>
        </div>

        {/* Contact section */}
        <div className={cn("mt-4 rounded-xl border p-3 space-y-2", listing.isUnlocked ? "border-emerald-100 bg-emerald-50/50" : "border-neutral-100 bg-neutral-50")}>
          {listing.isUnlocked ? (
            <>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-2">
                <CheckCircle className="w-3.5 h-3.5" /> Contact Unlocked
              </div>
              <p className="text-sm font-semibold text-neutral-900">{listing.host.firstName} {listing.host.lastName}</p>
              <p className="text-xs text-neutral-500">{listing.host.email}</p>
              <p className="text-xs text-neutral-500">{listing.host.phone}</p>
              <div className="flex gap-2 mt-2">
                {listing.host.phone && (
                  <a href={`tel:${listing.host.phone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-bt-primary text-white text-xs font-semibold">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                )}
                {listing.host.phone && (
                  <a href={`https://wa.me/${listing.host.phone}`} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#25D366] text-white text-xs font-semibold">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.132.558 4.133 1.528 5.876L0 24l6.324-1.51A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.79 9.79 0 01-5.003-1.376l-.36-.213-3.753.896.933-3.647-.236-.374A9.785 9.785 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z"/></svg>
                    WhatsApp
                  </a>
                )}
                {listing.host.email && (
                  <a href={`mailto:${listing.host.email}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-neutral-100 text-neutral-700 text-xs font-semibold">
                    <MessageCircle className="w-3.5 h-3.5" /> Email
                  </a>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Blurred contact preview */}
              <div className="space-y-1.5 select-none pointer-events-none">
                <div className="h-3.5 rounded-full bg-neutral-200 w-28 blur-[3px]" />
                <div className="h-3 rounded-full bg-neutral-200 w-36 blur-[3px]" />
                <div className="h-3 rounded-full bg-neutral-200 w-24 blur-[3px]" />
                <div className="flex gap-2 mt-2">
                  <div className="flex-1 h-8 rounded-lg bg-neutral-200 blur-[2px]" />
                  <div className="flex-1 h-8 rounded-lg bg-neutral-200 blur-[2px]" />
                </div>
              </div>
              <button
                onClick={() => onUnlock(listing._id)}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-bt-primary text-white text-sm font-bold hover:bg-bt-primary-light transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                Unlock Contact · {formatNaira(listing.unlockFee)}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
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
        <p className="text-xs text-neutral-500 truncate">{listing.lga}, {listing.state}</p>
        <p className="text-xs font-semibold text-bt-primary mt-0.5">{formatNaira(listing.price)}/yr</p>
        <div className="flex items-center gap-3 mt-1.5">
          {listing.host.phone && (
            <a href={`tel:${listing.host.phone}`} className="flex items-center gap-1 text-xs text-bt-primary font-semibold">
              <Phone className="w-3 h-3" /> {listing.host.phone}
            </a>
          )}
          {listing.host.phone && (
            <a href={`https://wa.me/${listing.host.phone}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[#25D366] font-semibold">
              WhatsApp
            </a>
          )}
        </div>
      </div>
      <div className="flex items-center">
        <CheckCircle className="w-5 h-5 text-emerald-500" />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function TenantSwitchContent() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"browse" | "my-unlocks">("browse");
  const [unlocking, setUnlocking] = useState<string | null>(null);

  const isLoggedIn = !!token;
  const isUser = user?.role === "user" || (!user?.role && isLoggedIn);

  useEffect(() => { loadPaystack(); }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["tenant-switch-listings"],
    queryFn: () => tenantSwitchApi.listings(1, 40),
    staleTime: 1000 * 60 * 2,
  });

  const { data: myListing } = useQuery({
    queryKey: ["tenant-switch-my-listing"],
    queryFn: tenantSwitchApi.myListing,
    enabled: isLoggedIn && isUser,
    staleTime: 1000 * 60 * 5,
  });

  const { data: myUnlocks = [], isLoading: loadingUnlocks } = useQuery({
    queryKey: ["tenant-switch-my-unlocks"],
    queryFn: tenantSwitchApi.myUnlocks,
    enabled: isLoggedIn && tab === "my-unlocks",
    staleTime: 1000 * 60 * 2,
  });

  const { data: freeUnlocks } = useQuery({
    queryKey: ["tenant-switch-free-unlocks"],
    queryFn: () => tenantSwitchApi.myListing().then(() =>
      fetch("/api/bt/v1/user/profile", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => d.userDetails?.tenantSwitchFreeUnlocks ?? 0)
    ),
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 5,
  });

  const handleUnlock = async (propertyId: string) => {
    if (!isLoggedIn) { toast.error("Sign in to unlock contact"); router.push("/auth/login"); return; }

    const listing = data?.listings.find((l: any) => l._id === propertyId);
    if (!listing) return;

    setUnlocking(propertyId);

    // Try free unlock first
    if ((freeUnlocks ?? 0) > 0) {
      try {
        await tenantSwitchApi.unlock(propertyId);
        toast.success("Contact unlocked with free unlock!");
        queryClient.invalidateQueries({ queryKey: ["tenant-switch-listings"] });
        queryClient.invalidateQueries({ queryKey: ["tenant-switch-free-unlocks"] });
      } catch (err: any) {
        toast.error(err.message || "Failed to unlock");
      }
      setUnlocking(null);
      return;
    }

    // Paid unlock via Paystack
    const PaystackPop = (window as any).PaystackPop;
    if (!PaystackPop) { toast.error("Payment not ready. Refresh and try."); setUnlocking(null); return; }

    const popup = new PaystackPop();
    popup.newTransaction({
      key: PAYSTACK_KEY,
      email: user?.email ?? "user@betatenant.com",
      amount: listing.unlockFee * 100, // kobo
      currency: "NGN",
      metadata: { propertyId, type: "tenant-switch-unlock" },
      onSuccess: async (res: any) => {
        try {
          await tenantSwitchApi.unlock(propertyId, res.reference);
          toast.success("Contact unlocked!");
          queryClient.invalidateQueries({ queryKey: ["tenant-switch-listings"] });
          queryClient.invalidateQueries({ queryKey: ["tenant-switch-my-unlocks"] });
        } catch (err: any) {
          toast.error(err.message || "Unlock failed");
        }
        setUnlocking(null);
      },
      onCancel: () => setUnlocking(null),
      onError: () => { toast.error("Payment failed"); setUnlocking(null); },
    });
  };

  const listings = data?.listings ?? [];

  return (
    <div className="min-h-screen bg-bt-surface">
      {/* Hero */}
      <div className="bg-white border-b border-neutral-100 py-10 md:py-14">
        <div className="max-w-[720px] mx-auto px-5 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bt-primary/8 text-bt-primary text-sm font-semibold mb-5">
            <Repeat2 className="w-4 h-4" />
            Tenant Switch
          </div>
          <h1 className="text-[26px] sm:text-[32px] font-bold text-neutral-900 tracking-[-0.02em] mb-3">
            Find Tenants Ready to Move Out
          </h1>
          <p className="text-neutral-500 leading-relaxed max-w-md mx-auto">
            Connect directly with tenants who are leaving — no agents, no middlemen. Pay a small fee to unlock contact details.
          </p>

          {/* Free unlocks banner */}
          {isLoggedIn && (freeUnlocks ?? 0) > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
              <Unlock className="w-4 h-4" />
              {freeUnlocks} free unlock{freeUnlocks !== 1 ? "s" : ""} available
            </div>
          )}

          {/* CTA */}
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            {isLoggedIn && isUser ? (
              myListing ? (
                <Link
                  href="/tenant-switch/list"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <Eye className="w-4 h-4" />
                  View My Space
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link
                  href="/tenant-switch/list"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-bt-primary text-white font-semibold text-sm hover:bg-bt-primary-light transition-colors shadow-[0_2px_8px_rgba(10,8,118,0.2)]"
                >
                  <Home className="w-4 h-4" />
                  List My Space
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )
            ) : !isLoggedIn ? (
              <Link href="/auth/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-bt-primary text-white font-semibold text-sm hover:bg-bt-primary-light transition-colors">
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
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[1360px] mx-auto px-5 lg:px-10 py-6">
        {/* Browse tab */}
        {tab === "browse" && (
          <>
            {/* Pricing info banner */}
            <div className="mb-6 p-4 bg-white rounded-2xl border border-neutral-100 shadow-sm">
              <p className="text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-bt-secondary" /> Unlock fee to reveal contact details:
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-neutral-600">
                <span className="px-3 py-1.5 bg-neutral-50 rounded-lg border border-neutral-100">Under ₦501k → <b>₦500</b></span>
                <span className="px-3 py-1.5 bg-neutral-50 rounded-lg border border-neutral-100">₦501k – ₦1.5M → <b>₦850</b></span>
                <span className="px-3 py-1.5 bg-neutral-50 rounded-lg border border-neutral-100">Above ₦1.5M → <b>₦1,500</b></span>
                <span className="px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-700 font-semibold">List your space → 5 free unlocks</span>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-[380px] rounded-2xl bg-neutral-100 animate-pulse" />
                ))}
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {listings.map((l: any) => (
                  <div key={l._id} className={cn(unlocking === l._id && "opacity-60 pointer-events-none")}>
                    <TenantSwitchCard listing={l} onUnlock={handleUnlock} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                  <Repeat2 className="w-7 h-7 text-neutral-300" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">No swap listings right now</h3>
                <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto">Be the first to list your space.</p>
                <Link href={isLoggedIn ? "/tenant-switch/list" : "/auth/login"}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-bt-primary text-white font-semibold text-sm">
                  <Home className="w-4 h-4" /> List My Space
                </Link>
              </div>
            )}
          </>
        )}

        {/* My Unlocks tab */}
        {tab === "my-unlocks" && (
          <div>
            <h2 className="text-base font-bold text-neutral-900 mb-4">Your Unlocked Contacts</h2>
            {loadingUnlocks ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-neutral-100 animate-pulse" />
                ))}
              </div>
            ) : (myUnlocks as any[]).length > 0 ? (
              <div className="space-y-3">
                {(myUnlocks as any[]).map((l: any) => (
                  <MyUnlockCard key={l._id} listing={l} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                  <Unlock className="w-6 h-6 text-neutral-300" />
                </div>
                <p className="text-neutral-500 text-sm">You haven&apos;t unlocked any contacts yet.</p>
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
