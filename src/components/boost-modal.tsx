"use client";

/**
 * BoostModal — single-listing boost flow.
 *
 * Flow:
 *  1. User picks boost type (Boost / Featured / Spotlight)
 *  2. "Boost Now" → POST /v1/user/boost/apply
 *     a. Success → show confirmation, call onSuccess()
 *     b. INSUFFICIENT_CREDITS → slide to buy-credits view
 *  3. Buy credits → Paystack inline checkout
 *     a. Payment success → immediately retry the boost (persistence)
 */

import { useEffect, useRef, useState } from "react";
import {
  X, Zap, Star, Flame, CreditCard, Loader2, Check, ChevronLeft,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const BOOST_TYPES = [
  {
    id:       "boost" as const,
    icon:     "🚀",
    label:    "Boost",
    credits:  1,
    duration: "48 hours",
    desc:     "Quick visibility lift in relevant searches",
    color:    "border-bt-primary bg-bt-primary/5",
    btnColor: "bg-bt-primary hover:bg-bt-primary-light",
  },
  {
    id:       "featured" as const,
    icon:     "⭐",
    label:    "Featured",
    credits:  3,
    duration: "7 days",
    desc:     "Stronger placement with Featured badge",
    color:    "border-amber-300 bg-amber-50",
    btnColor: "bg-amber-500 hover:bg-amber-600",
  },
  {
    id:       "spotlight" as const,
    icon:     "🔥",
    label:    "Spotlight",
    credits:  7,
    duration: "7 days",
    desc:     "Premium top-of-search visibility",
    color:    "border-red-300 bg-red-50",
    btnColor: "bg-red-500 hover:bg-red-600",
  },
] as const;

type BoostTypeId = "boost" | "featured" | "spotlight";

const CREDIT_PACKS = [
  { pack: "1",   credits: 1,   price: 500   },
  { pack: "5",   credits: 5,   price: 2000  },
  { pack: "10",  credits: 10,  price: 3500, popular: true },
  { pack: "25",  credits: 25,  price: 7500  },
  { pack: "50",  credits: 50,  price: 12500 },
  { pack: "100", credits: 100, price: 20000 },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  propertyName?: string;
  onSuccess?: (type: BoostTypeId) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BoostModal({ open, onClose, propertyId, propertyName, onSuccess }: Props) {
  type View = "pick" | "buy" | "done";

  const [view, setView]               = useState<View>("pick");
  const [selectedType, setSelectedType] = useState<BoostTypeId>("boost");
  const [balance, setBalance]         = useState<number | null>(null);
  const [boosting, setBoosting]       = useState(false);
  const [selectedPack, setSelectedPack] = useState("10");
  const [buying, setBuying]           = useState(false);
  const [pendingBoostType, setPendingBoostType] = useState<BoostTypeId | null>(null);
  const scriptReady = useRef(false);

  // Load credit balance + Paystack script when modal opens
  useEffect(() => {
    if (!open) return;
    setView("pick");
    setPendingBoostType(null);
    api.get<any>("/v1/user/boost/balance")
      .then(r => setBalance(r.available ?? 0))
      .catch(() => {});

    if (typeof window !== "undefined" && !scriptReady.current) {
      if (!document.querySelector('script[src*="paystack.co/v2/inline"]')) {
        const s = document.createElement("script");
        s.src = "https://js.paystack.co/v2/inline.js";
        s.async = true;
        s.onload = () => { scriptReady.current = true; };
        document.body.appendChild(s);
      } else scriptReady.current = true;
    }
  }, [open]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const applyBoost = async (type: BoostTypeId) => {
    setBoosting(true);
    try {
      await api.post<any>("/v1/user/boost/apply", { propertyIds: [propertyId], type });
      const creditsUsed = BOOST_TYPES.find(b => b.id === type)!.credits;
      setBalance(b => b !== null ? Math.max(0, b - creditsUsed) : null);
      setView("done");
      onSuccess?.(type);
      toast.success(`Listing boosted! 🚀`);
    } catch (err: any) {
      if (err.message?.includes("INSUFFICIENT")) {
        setPendingBoostType(type);
        setView("buy");
      } else {
        toast.error(err.message || "Failed to boost");
      }
    } finally {
      setBoosting(false);
    }
  };

  const handleBuyCredits = async () => {
    setBuying(true);
    try {
      const returnTo = typeof window !== "undefined" ? window.location.pathname : "";
      const res = await api.post<any>("/v1/user/boost/buy", {
        pack: selectedPack,
        returnTo,
        // Tell backend which listing to auto-boost after successful payment
        pendingBoostPropertyId: pendingBoostType ? propertyId : undefined,
        pendingBoostType:       pendingBoostType ?? undefined,
      });
      if (res.provider === "bachs" || (!res.accessCode && res.checkoutUrl)) {
        window.location.href = res.checkoutUrl;
        return;
      }

      const PaystackPop = (window as any).PaystackPop;
      if (!PaystackPop) {
        window.location.href = res.checkoutUrl ?? "";
        return;
      }

      const popup = new PaystackPop();
      popup.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "",
        accessCode: res.accessCode,
        onSuccess: async () => {
          setBuying(false);
          const pack = CREDIT_PACKS.find(p => p.pack === selectedPack)!;
          toast.success(`${pack.credits} credits purchased!`);
          setBalance(b => (b ?? 0) + pack.credits);

          // Auto-apply the pending boost immediately — persistence!
          if (pendingBoostType) {
            await applyBoost(pendingBoostType);
          } else {
            setView("pick");
          }
        },
        onCancel: () => setBuying(false),
        onError:  () => { setBuying(false); toast.error("Payment failed"); },
      });
    } catch (err: any) {
      toast.error(err.message || "Could not start payment");
      setBuying(false);
    }
  };

  if (!open) return null;

  const creditCost = BOOST_TYPES.find(b => b.id === selectedType)!.credits;
  const hasEnough  = balance !== null && balance >= creditCost;

  return (
    <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">

        {/* Handle + header */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-neutral-200" />
        </div>
        <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-neutral-50">
          {view === "buy" && (
            <button onClick={() => setView("pick")} className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors shrink-0">
              <ChevronLeft className="w-4 h-4 text-neutral-600" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-neutral-900">
              {view === "pick" ? "Boost Listing" : view === "buy" ? "Buy Boost Credits" : "Boost Applied!"}
            </p>
            {propertyName && view !== "done" && (
              <p className="text-[11px] text-neutral-400 truncate">{propertyName}</p>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors shrink-0">
            <X className="w-4 h-4 text-neutral-600" />
          </button>
        </div>

        {/* ── Pick boost type ── */}
        {view === "pick" && (
          <div className="px-5 py-4 space-y-3">
            {/* Credit balance */}
            {balance !== null && (
              <div className="flex items-center justify-between text-xs text-neutral-500 bg-neutral-50 rounded-xl px-3.5 py-2.5">
                <span>Your boost credits</span>
                <span className="font-bold text-bt-primary">{balance} available</span>
              </div>
            )}

            {/* Type options */}
            <div className="space-y-2">
              {BOOST_TYPES.map((bt) => {
                const canAfford = balance === null || balance >= bt.credits;
                return (
                  <button
                    key={bt.id}
                    onClick={() => setSelectedType(bt.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left",
                      selectedType === bt.id ? bt.color : "bg-white border-neutral-100 hover:border-neutral-200",
                      !canAfford && "opacity-50"
                    )}
                  >
                    <span className="text-xl shrink-0">{bt.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-neutral-900">{bt.label}</p>
                        <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-full">
                          {bt.credits} credit{bt.credits > 1 ? "s" : ""} · {bt.duration}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">{bt.desc}</p>
                    </div>
                    {selectedType === bt.id && (
                      <div className="w-5 h-5 rounded-full bg-bt-primary flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* CTA */}
            {!hasEnough && balance !== null ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Need {creditCost - balance} more credit{creditCost - balance > 1 ? "s" : ""} — buy below and we'll boost automatically.
                </div>
                <button
                  onClick={() => { setPendingBoostType(selectedType); setView("buy"); }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-bt-primary text-white font-bold text-sm hover:bg-bt-primary-light transition-colors">
                  <CreditCard className="w-4 h-4" /> Buy Credits &amp; Boost
                </button>
              </div>
            ) : (
              <button
                onClick={() => applyBoost(selectedType)}
                disabled={boosting}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-60",
                  BOOST_TYPES.find(b => b.id === selectedType)!.btnColor
                )}>
                {boosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{BOOST_TYPES.find(b => b.id === selectedType)!.icon}</span>}
                {boosting ? "Boosting..." : `Boost Now · ${creditCost} credit${creditCost > 1 ? "s" : ""}`}
              </button>
            )}
          </div>
        )}

        {/* ── Buy credits ── */}
        {view === "buy" && (
          <div className="px-5 py-4 space-y-3">
            {pendingBoostType && (
              <div className="flex items-center gap-2 text-xs text-bt-primary bg-bt-primary/5 border border-bt-primary/15 rounded-xl px-3.5 py-2.5">
                <span>{BOOST_TYPES.find(b => b.id === pendingBoostType)!.icon}</span>
                After purchase, your listing will be boosted automatically.
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              {CREDIT_PACKS.map((pack) => (
                <button
                  key={pack.pack}
                  onClick={() => setSelectedPack(pack.pack)}
                  className={cn(
                    "relative rounded-xl border p-3 text-center transition-all",
                    selectedPack === pack.pack ? "border-bt-primary bg-bt-primary/5" : "border-neutral-100 bg-white hover:border-neutral-200",
                    pack.popular && selectedPack !== pack.pack ? "border-amber-200 bg-amber-50/50" : ""
                  )}>
                  {pack.popular && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-900 text-[9px] font-bold whitespace-nowrap">Popular</span>
                  )}
                  <p className="text-sm font-bold text-neutral-900">{pack.credits}</p>
                  <p className="text-[10px] text-neutral-400">credits</p>
                  <p className="text-xs font-semibold text-neutral-700 mt-1">₦{pack.price.toLocaleString()}</p>
                  {selectedPack === pack.pack && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-bt-primary flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={handleBuyCredits}
              disabled={buying}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-bt-primary text-white font-bold text-sm disabled:opacity-60 hover:bg-bt-primary-light transition-all active:scale-[0.98]">
              {buying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {buying ? "Opening payment..." : `Buy ${CREDIT_PACKS.find(p => p.pack === selectedPack)?.credits} Credits — ₦${CREDIT_PACKS.find(p => p.pack === selectedPack)?.price.toLocaleString()}`}
            </button>
            <p className="text-center text-xs text-neutral-400">Card · Bank Transfer · USSD · Secure via Paystack</p>
          </div>
        )}

        {/* ── Done ── */}
        {view === "done" && (
          <div className="px-5 py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-base font-bold text-neutral-900">Listing Boosted!</p>
            <p className="text-sm text-neutral-500">
              Your listing is now {selectedType === "spotlight" ? "🔥 Spotlighted" : selectedType === "featured" ? "⭐ Featured" : "🚀 Boosted"} and will appear higher in relevant searches.
            </p>
            {balance !== null && (
              <p className="text-xs text-neutral-400">{balance} credits remaining</p>
            )}
            <button onClick={onClose} className="w-full py-3 rounded-xl bg-neutral-100 text-neutral-700 font-semibold text-sm hover:bg-neutral-200 transition-colors mt-2">
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
