"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Zap, Crown, Loader2, Check, CreditCard,
  Star, Flame, ChevronRight, Home, Eye, AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import { AuthGuard } from "@/components/auth-guard";
import { api } from "@/lib/api";
import { formatPriceFullNumber } from "@/lib/constants";
import { cn } from "@/lib/utils";

const BOOST_TYPES = [
  {
    id: "boost",
    label: "Boost",
    icon: "🚀",
    credits: 1,
    duration: "48 hours",
    desc: "Quick visibility lift in relevant searches",
    color: "border-bt-primary/30 bg-bt-primary/5",
    badge: "bg-bt-primary text-white",
  },
  {
    id: "featured",
    label: "Featured",
    icon: "⭐",
    credits: 3,
    duration: "7 days",
    desc: "Stronger placement with Featured badge",
    color: "border-amber-200 bg-amber-50",
    badge: "bg-amber-500 text-white",
  },
  {
    id: "spotlight",
    label: "Spotlight",
    icon: "🔥",
    credits: 7,
    duration: "7 days",
    desc: "Premium top-of-search visibility",
    color: "border-red-200 bg-red-50",
    badge: "bg-red-500 text-white",
  },
] as const;

const CREDIT_PACKS = [
  { pack: "1",   credits: 1,   price: 500,   label: "Starter" },
  { pack: "5",   credits: 5,   price: 2000,  label: "Basic",   saving: "₦500 off" },
  { pack: "10",  credits: 10,  price: 3500,  label: "Popular", saving: "₦1,500 off", highlight: true },
  { pack: "25",  credits: 25,  price: 7500,  label: "Growth",  saving: "₦5,000 off" },
  { pack: "50",  credits: 50,  price: 12500, label: "Pro",     saving: "₦12,500 off" },
  { pack: "100", credits: 100, price: 20000, label: "Agency",  saving: "₦30,000 off" },
];

interface Property {
  _id: string;
  houseName?: string;
  apartmentType?: string;
  propertyLGA?: string;
  propertyState?: string;
  listingFee?: number;
  photoURLs?: string[];
  propertyStatus?: string;
  totalViews?: number;
}

type BoostTypeId = "boost" | "featured" | "spotlight";

function BoostContent() {
  const router = useRouter();
  const [tab, setTab] = useState<"boost" | "buy">("boost");

  // Credits
  const [balance, setBalance] = useState<any>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  // Listings
  const [listings, setListings] = useState<Property[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Boost type
  const [boostType, setBoostType] = useState<BoostTypeId>("boost");

  // Applying
  const [applying, setApplying] = useState(false);

  // Buy credits
  const [selectedPack, setSelectedPack] = useState("10");
  const [buying, setBuying] = useState(false);
  const scriptReady = useRef(false);

  useEffect(() => {
    Promise.all([
      api.get<any>("/v1/user/boost/balance"),
      api.post<any>("/v1/landlordandagent/properties/1/100", {}),
    ]).then(([bal, props]) => {
      setBalance(bal);
      const active = (props?.properties ?? []).filter((p: any) => p.propertyStatus === "available");
      setListings(active);
    }).catch(() => toast.error("Failed to load"))
      .finally(() => { setLoadingBalance(false); setLoadingListings(false); });

    // Preload Paystack
    if (typeof window !== "undefined" && !scriptReady.current) {
      if (!document.querySelector('script[src*="paystack.co/v2/inline"]')) {
        const s = document.createElement("script");
        s.src = "https://js.paystack.co/v2/inline.js";
        s.async = true;
        s.onload = () => { scriptReady.current = true; };
        document.body.appendChild(s);
      } else scriptReady.current = true;
    }
  }, []);

  const creditsNeeded = selected.size * (BOOST_TYPES.find(b => b.id === boostType)?.credits ?? 1);
  const available = balance ? (balance.available ?? 0) : 0;
  const canBoost = selected.size > 0 && available >= creditsNeeded;

  const toggleListing = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === listings.length) setSelected(new Set());
    else setSelected(new Set(listings.map(l => l._id)));
  };

  const handleApplyBoost = async () => {
    if (!canBoost) return;
    setApplying(true);
    try {
      const res = await api.post<any>("/v1/user/boost/apply", {
        propertyIds: Array.from(selected),
        type: boostType,
      });
      toast.success(`${res.boosted} listing${res.boosted !== 1 ? "s" : ""} boosted! ${res.creditsRemaining} credits left.`);
      setSelected(new Set());
      // Refresh balance
      api.get<any>("/v1/user/boost/balance").then(setBalance).catch(() => {});
    } catch (err: any) {
      if (err.message?.includes("INSUFFICIENT")) {
        toast.error("Not enough credits. Buy more below.");
        setTab("buy");
      } else {
        toast.error(err.message || "Failed to apply boost");
      }
    } finally {
      setApplying(false);
    }
  };

  const handleBuyCredits = async () => {
    setBuying(true);
    try {
      const res = await api.post<any>("/v1/user/boost/buy", { pack: selectedPack });
      const PaystackPop = (window as any).PaystackPop;
      if (!PaystackPop) { toast.error("Payment not ready. Refresh and try."); setBuying(false); return; }
      const popup = new PaystackPop();
      popup.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "",
        accessCode: res.accessCode,
        onSuccess: () => {
          setBuying(false);
          toast.success(`${res.credits} Boost Credits purchased!`);
          api.get<any>("/v1/user/boost/balance").then(setBalance).catch(() => {});
          setTab("boost");
        },
        onCancel: () => setBuying(false),
        onError:  () => { setBuying(false); toast.error("Payment failed"); },
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to start payment");
      setBuying(false);
    }
  };

  const chosenBoostType = BOOST_TYPES.find(b => b.id === boostType)!;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-neutral-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors">
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </button>
          <h1 className="text-base font-bold text-neutral-900 flex-1">Boost Listings</h1>
          {/* Credit balance */}
          {!loadingBalance && balance && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bt-primary/8 text-bt-primary text-sm font-bold">
              <Zap className="w-3.5 h-3.5" />
              {balance.available} credits
            </div>
          )}
        </div>
        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 flex gap-0 border-t border-neutral-50">
          {(["boost", "buy"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-3 text-sm font-semibold transition-all border-b-2",
                tab === t ? "border-bt-primary text-bt-primary" : "border-transparent text-neutral-400"
              )}>
              {t === "boost" ? "🚀 Boost Listings" : "💳 Buy Credits"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {tab === "boost" ? (
          <>
            {/* Credit breakdown */}
            {balance && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Available", value: balance.available, color: "text-bt-primary" },
                  { label: "Monthly", value: `${balance.monthly}/${balance.monthlyTotal}`, color: "text-neutral-700" },
                  { label: "Purchased", value: balance.purchased, color: "text-neutral-700" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white rounded-xl border border-neutral-100 p-3 text-center">
                    <p className={cn("text-lg font-bold", color)}>{value}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5 uppercase tracking-wide">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Boost type picker */}
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2 px-1">Choose boost type</p>
              <div className="space-y-2">
                {BOOST_TYPES.map((bt) => (
                  <button key={bt.id} onClick={() => setBoostType(bt.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left",
                      boostType === bt.id ? bt.color + " border-opacity-100" : "bg-white border-neutral-100 hover:border-neutral-200"
                    )}>
                    <span className="text-xl shrink-0">{bt.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-neutral-900">{bt.label}</p>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", bt.badge)}>
                          {bt.credits} credit{bt.credits > 1 ? "s" : ""} · {bt.duration}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">{bt.desc}</p>
                    </div>
                    {boostType === bt.id && <Check className="w-4 h-4 text-bt-primary shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Listing selector */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                  Select listings ({selected.size} selected)
                </p>
                {listings.length > 0 && (
                  <button onClick={selectAll} className="text-xs font-semibold text-bt-primary hover:underline">
                    {selected.size === listings.length ? "Deselect all" : "Select all"}
                  </button>
                )}
              </div>

              {loadingListings ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-bt-primary" /></div>
              ) : listings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-neutral-100 p-8 text-center">
                  <Home className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                  <p className="text-sm text-neutral-500 mb-3">No active listings to boost</p>
                  <Link href="/host/new" className="text-bt-primary text-sm font-semibold hover:underline">Add a listing</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {listings.map((p) => {
                    const isSelected = selected.has(p._id);
                    return (
                      <button key={p._id} onClick={() => toggleListing(p._id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left",
                          isSelected ? "border-bt-primary bg-bt-primary/5" : "bg-white border-neutral-100 hover:border-neutral-200"
                        )}>
                        <div className="w-14 h-12 rounded-lg overflow-hidden shrink-0 bg-neutral-100">
                          {p.photoURLs?.[0]
                            ? <img src={p.photoURLs[0]} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Home className="w-5 h-5 text-neutral-300" /></div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 truncate">
                            {p.houseName || `${p.apartmentType} in ${p.propertyLGA}`}
                          </p>
                          <p className="text-xs text-neutral-400 truncate">{p.propertyLGA}, {p.propertyState}</p>
                          {(p.totalViews ?? 0) > 0 && (
                            <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                              <Eye className="w-3 h-3" />{p.totalViews} views
                            </p>
                          )}
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
                          isSelected ? "border-bt-primary bg-bt-primary" : "border-neutral-300"
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Summary + apply */}
            {selected.size > 0 && (
              <div className="sticky bottom-4">
                <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">{selected.size} listing{selected.size > 1 ? "s" : ""} × {chosenBoostType.credits} credit{chosenBoostType.credits > 1 ? "s" : ""}</span>
                    <span className="font-bold text-neutral-900">{creditsNeeded} credits</span>
                  </div>
                  {available < creditsNeeded && (
                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Need {creditsNeeded - available} more credits.{" "}
                      <button onClick={() => setTab("buy")} className="font-bold underline">Buy now</button>
                    </div>
                  )}
                  <button onClick={handleApplyBoost} disabled={applying || !canBoost}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-bt-primary text-white font-bold text-sm disabled:opacity-60 hover:bg-bt-primary-light transition-colors">
                    {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{chosenBoostType.icon}</span>}
                    {applying ? "Boosting..." : `Boost ${selected.size} listing${selected.size > 1 ? "s" : ""} · ${creditsNeeded} credits`}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Buy credits */}
            <p className="text-sm text-neutral-500">Credits never expire for 90 days after purchase. Monthly subscription credits reset each billing cycle.</p>

            <div className="space-y-2">
              {CREDIT_PACKS.map((pack) => (
                <button key={pack.pack} onClick={() => setSelectedPack(pack.pack)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left",
                    selectedPack === pack.pack ? "border-bt-primary bg-bt-primary/5" : "bg-white border-neutral-100 hover:border-neutral-200",
                    pack.highlight && selectedPack !== pack.pack && "border-amber-200 bg-amber-50/50"
                  )}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-neutral-900">{pack.credits} Credits</span>
                      {pack.highlight && <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-900 text-[10px] font-bold">Most popular</span>}
                      {pack.saving && <span className="text-[11px] text-emerald-600 font-semibold">{pack.saving}</span>}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">₦{Math.round(pack.price / pack.credits)} per credit</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-neutral-900">₦{pack.price.toLocaleString()}</p>
                  </div>
                  {selectedPack === pack.pack && <Check className="w-4 h-4 text-bt-primary shrink-0" />}
                </button>
              ))}
            </div>

            <button onClick={handleBuyCredits} disabled={buying}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-bt-primary text-white font-bold text-sm disabled:opacity-60 hover:bg-bt-primary-light transition-colors shadow-[0_4px_14px_rgba(10,8,118,0.25)]">
              {buying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {buying ? "Opening payment..." : `Buy ${CREDIT_PACKS.find(p => p.pack === selectedPack)?.credits} Credits — ₦${CREDIT_PACKS.find(p => p.pack === selectedPack)?.price.toLocaleString()}`}
            </button>
            <p className="text-center text-xs text-neutral-400">Card · Bank Transfer · USSD · Secure via Paystack</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function BoostPage() {
  return <AuthGuard><BoostContent /></AuthGuard>;
}
