"use client";

import { useEffect, useRef, useState } from "react";
import { X, Crown, Check, CreditCard, Loader2, Zap, TrendingUp, Shield, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PK = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "";
const MONTHLY_PLAN = process.env.NEXT_PUBLIC_PAYSTACK_MONTHLY_PLAN_ID ?? "";
const YEARLY_PLAN  = process.env.NEXT_PUBLIC_PAYSTACK_YEARLY_PLAN_ID ?? "";
const MONTHLY_PRICE = Number(process.env.NEXT_PUBLIC_PAYSTACK_MONTHLY_PRICE ?? 5000);
const YEARLY_PRICE  = Math.round(MONTHLY_PRICE * 12 * 0.8); // 20% off annual

const FEATURES = [
  { icon: Zap,         title: "Unlimited Listings",  desc: "Remove the 5-property limit and list as many homes as you manage" },
  { icon: Crown,       title: "Premium Badge",        desc: "Stand out with a verified gold crown badge on your listings" },
  { icon: TrendingUp,  title: "Priority Placement",   desc: "Your properties appear first in search results" },
  { icon: Shield,      title: "Verified Status",      desc: "Build trust with tenants through verified agent status" },
  { icon: BarChart2,   title: "Advanced Analytics",   desc: "See exactly who is viewing and saving your listings" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  userEmail: string;
  userId: string;
  onSuccess?: () => void;
}

export function GoPremiumModal({ open, onClose, userEmail, userId, onSuccess }: Props) {
  const [plan, setPlan]       = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const scriptReady = useRef(false);

  // Load Paystack v2 inline script once
  useEffect(() => {
    if (typeof window === "undefined" || scriptReady.current) return;
    if (document.querySelector('script[src*="paystack.co/v2/inline"]')) {
      scriptReady.current = true; return;
    }
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v2/inline.js";
    s.async = true;
    s.onload = () => { scriptReady.current = true; };
    document.body.appendChild(s);
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handlePay = () => {
    if (!userEmail || !PK) return;
    const PaystackPop = (window as any).PaystackPop;
    if (!PaystackPop) { return; }

    setLoading(true);
    const planCode = plan === "monthly" ? MONTHLY_PLAN : YEARLY_PLAN;

    // v2 API: new PaystackPop() instance → .newTransaction()
    // planCode is used for subscriptions; amount is omitted (plan defines billing amount)
    const popup = new PaystackPop();
    popup.newTransaction({
      key:       PK,
      email:     userEmail,
      planCode,                          // subscription plan — amount NOT needed
      reference: `${plan}-sub-${userId}-${Date.now()}`,
      currency:  "NGN",
      channels:  ["card"],
      onSuccess: () => { setLoading(false); onSuccess?.(); onClose(); },
      onCancel:  () => setLoading(false),
      onError:   () => setLoading(false),
    });
  };

  if (!open) return null;

  const price    = plan === "monthly" ? MONTHLY_PRICE : YEARLY_PRICE;
  const perMonth = plan === "yearly"  ? Math.round(YEARLY_PRICE / 12) : MONTHLY_PRICE;
  const hasPlan  = plan === "monthly" ? !!MONTHLY_PLAN : !!YEARLY_PLAN;

  return (
    <div className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="bg-gradient-to-br from-bt-primary via-[#1a1a8c] to-[#3b0764] px-6 pt-8 pb-6 text-center relative">
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-amber-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Crown className="w-7 h-7 text-amber-900 fill-amber-900" />
          </div>
          <h2 className="text-xl font-bold text-white">Upgrade to Premium</h2>
          <p className="text-sm text-white/70 mt-1">Unlock tools to grow your rental business</p>
        </div>

        <div className="px-5 py-5 space-y-4">

          {/* Features */}
          <ul className="space-y-2.5">
            {FEATURES.map(({ title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{title}</p>
                  <p className="text-xs text-neutral-500">{desc}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Plan toggle */}
          <div className="flex gap-2 p-1 bg-neutral-100 rounded-xl">
            {(["monthly", "yearly"] as const).map((p) => (
              <button key={p} onClick={() => setPlan(p)}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all relative",
                  plan === p ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500"
                )}>
                {p === "yearly" && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-400 text-amber-900 text-[10px] font-bold whitespace-nowrap">
                    Save 20%
                  </span>
                )}
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {/* Price display */}
          <div className="bg-bt-primary/5 border border-bt-primary/15 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-bt-primary">₦{price.toLocaleString()}</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {plan === "yearly"
                  ? `₦${perMonth.toLocaleString()}/month · billed annually`
                  : "per month"}
              </p>
            </div>
            {plan === "yearly" && (
              <div className="text-right">
                <p className="text-xs text-neutral-400 line-through">₦{(MONTHLY_PRICE * 12).toLocaleString()}</p>
                <p className="text-xs font-semibold text-green-600">
                  Save ₦{(MONTHLY_PRICE * 12 - YEARLY_PRICE).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={handlePay}
            disabled={loading || !userEmail || !hasPlan}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl bg-bt-primary text-white font-bold text-sm disabled:opacity-60 hover:bg-bt-primary-light active:scale-[0.98] transition-all shadow-[0_4px_14px_rgba(10,8,118,0.3)]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {loading ? "Opening payment..." : "Pay & Upgrade Now"}
          </button>

          {!hasPlan && (
            <p className="text-center text-xs text-amber-600">
              Subscription plan not yet configured — contact support.
            </p>
          )}
          <p className="text-center text-xs text-neutral-400 -mt-1">
            Secure payment via Paystack · Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
