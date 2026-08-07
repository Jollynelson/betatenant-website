"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Crown, Check, Zap, TrendingUp, Shield, BarChart2,
  Calendar, CreditCard, Loader2, AlertTriangle, ChevronRight,
  RefreshCw, Clock, X,
} from "lucide-react";
import toast from "react-hot-toast";
import { AuthGuard } from "@/components/auth-guard";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── Tier definitions ─────────────────────────────────────────────────────────

const TIERS = [
  {
    id: "pro",
    name: "Agent Pro",
    monthlyPrice: 5000,
    yearlyPrice:  48000,
    listingLimit: 20,
    boostCredits: 10,
    color: "border-bt-primary/30",
    badge: "bg-bt-primary text-white",
    features: [
      "Up to 20 active listings",
      "10 Boost Credits/month",
      "Priority placement in search",
      "Premium badge on listings",
      "Analytics dashboard",
      "Verified agent status",
    ],
  },
  {
    id: "pro_plus",
    name: "Agent Pro Plus",
    monthlyPrice: 10000,
    yearlyPrice:  96000,
    listingLimit: 50,
    boostCredits: 30,
    color: "border-amber-300",
    badge: "bg-amber-500 text-white",
    highlight: true,
    features: [
      "Up to 50 active listings",
      "30 Boost Credits/month",
      "Auto Boost (coming soon)",
      "Everything in Pro",
      "Advanced analytics",
      "Priority support",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    monthlyPrice: 25000,
    yearlyPrice:  240000,
    listingLimit: 999,
    boostCredits: 100,
    color: "border-purple-300",
    badge: "bg-purple-600 text-white",
    features: [
      "Unlimited active listings",
      "100 Boost Credits/month",
      "Portfolio rotation",
      "Everything in Pro Plus",
      "Agency-level analytics",
      "Team features",
    ],
  },
] as const;

type TierId = "pro" | "pro_plus" | "agency";
type Billing = "monthly" | "yearly";
type SubStatus = "active" | "expired" | "cancelled" | "none";
type View = "home" | "plans" | "manage" | "cancel";

interface SubInfo {
  status: SubStatus;
  tier: TierId | null;
  plan: Billing | null;
  expiresAt: string | null;
  activatedAt: string | null;
  listingLimit?: number;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function SubscriptionContent() {
  const router = useRouter();
  const [view, setView] = useState<View>(() => {
    if (typeof window !== "undefined" && window.location.hash === "#plans") return "plans";
    return "home";
  });
  const [sub, setSub]           = useState<SubInfo | null>(null);
  const [loading, setLoading]   = useState(true);
  const [paying, setPaying]     = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [selectedTier, setSelectedTier] = useState<TierId>("pro");
  const [billing, setBilling]   = useState<Billing>("monthly");
  const scriptReady = useRef(false);

  const loadSub = () =>
    api.get<any>("/v1/user/subscription/status")
      .then((r) => setSub({
        status:   r.status ?? "none",
        tier:     r.tier   ?? null,
        plan:     r.plan   ?? null,
        expiresAt:    r.expiresAt,
        activatedAt:  r.activatedAt,
        listingLimit: r.listingLimit,
      }))
      .catch(() => setSub({ status: "none", tier: null, plan: null, expiresAt: null, activatedAt: null }));

  useEffect(() => {
    loadSub().finally(() => setLoading(false));

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

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await api.post<any>("/v1/user/subscription/initiate", { tier: selectedTier, billing });
      const PaystackPop = (window as any).PaystackPop;
      if (!PaystackPop) { toast.error("Payment system not ready. Refresh and try."); setPaying(false); return; }
      const popup = new PaystackPop();
      popup.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "",
        accessCode: res.accessCode,
        onSuccess: () => {
          setPaying(false);
          toast.success("🎉 Subscription activated!");
          loadSub();
          setView("manage");
        },
        onCancel: () => setPaying(false),
        onError:  () => { setPaying(false); toast.error("Payment failed. Try again."); },
      });
    } catch (err: any) {
      toast.error(err.message || "Could not start payment");
      setPaying(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.post<any>("/v1/user/subscription/cancel", {});
      toast.success("Subscription cancelled. Access continues until expiry.");
      setSub((s) => s ? { ...s, status: "cancelled" } : s);
      setView("home");
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel");
    } finally { setCancelling(false); }
  };

  const isActive      = sub?.status === "active";
  const isCancelled   = sub?.status === "cancelled";
  const activeTier    = TIERS.find(t => t.id === sub?.tier);
  const daysLeft      = sub?.expiresAt ? Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / 86_400_000) : null;
  const expiringSoon  = isActive && daysLeft !== null && daysLeft <= 7;

  // ── Views ──────────────────────────────────────────────────────────────────

  const renderHome = () => (
    <div className="space-y-4">
      {/* Active banner */}
      {isActive && sub && activeTier && (
        <div className={cn("rounded-2xl p-4 border", expiringSoon ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200")}>
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", expiringSoon ? "bg-amber-100" : "bg-emerald-100")}>
              <Crown className={cn("w-5 h-5", expiringSoon ? "text-amber-600 fill-amber-600" : "text-emerald-600 fill-emerald-600")} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-neutral-900">{activeTier.name} — {sub.plan === "yearly" ? "Annual" : "Monthly"}</p>
              <p className={cn("text-xs mt-0.5 flex items-center gap-1", expiringSoon ? "text-amber-700" : "text-neutral-500")}>
                <Calendar className="w-3 h-3" />
                {expiringSoon ? `Expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}` : `Renews ${new Date(sub.expiresAt!).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}`}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">{activeTier.listingLimit === 999 ? "Unlimited" : `Up to ${activeTier.listingLimit}`} listings · {activeTier.boostCredits} boost credits/month</p>
            </div>
            <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold", expiringSoon ? "bg-amber-200 text-amber-800" : "bg-emerald-200 text-emerald-800")}>Active</span>
          </div>
        </div>
      )}

      {isCancelled && sub?.expiresAt && (
        <div className="rounded-2xl p-4 border bg-neutral-50 border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-neutral-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">{activeTier?.name ?? "Subscription"} Cancelled</p>
              <p className="text-xs text-neutral-500 mt-0.5">Access until {new Date(sub.expiresAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
          </div>
        </div>
      )}

      <Section title="Subscription">
        <MenuRow icon={Crown} label="Available plans" desc="Compare tiers and pricing" iconBg="bg-amber-50" iconColor="text-amber-500" onClick={() => setView("plans")} />
        {(isActive || isCancelled) && (
          <MenuRow icon={RefreshCw} label="Manage subscription" desc={isActive ? "Upgrade, renew or change plan" : "Reactivate your subscription"} onClick={() => setView("manage")} />
        )}
        {isActive && (
          <MenuRow icon={X} label="Cancel subscription" desc="Stop renewal" iconBg="bg-red-50" iconColor="text-red-500" onClick={() => setView("cancel")} />
        )}
      </Section>
    </div>
  );

  const renderPlans = () => {
    const tier = TIERS.find(t => t.id === selectedTier)!;
    const price = billing === "monthly" ? tier.monthlyPrice : tier.yearlyPrice;

    return (
      <div className="space-y-4">
        {/* Billing toggle */}
        <div className="flex gap-2 p-1 bg-neutral-100 rounded-xl">
          {(["monthly", "yearly"] as Billing[]).map((b) => (
            <button key={b} onClick={() => setBilling(b)}
              className={cn("flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all relative",
                billing === b ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500")}>
              {b === "yearly" && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-400 text-amber-900 text-[10px] font-bold whitespace-nowrap">Save 20%</span>
              )}
              {b.charAt(0).toUpperCase() + b.slice(1)}
            </button>
          ))}
        </div>

        {/* Tier cards — tap to select, tap selected to expand features */}
        <div className="space-y-3">
          {TIERS.map((t) => (
            <TierCard
              key={t.id}
              tier={t}
              billing={billing}
              isSelected={selectedTier === t.id}
              isCurrentPlan={sub?.tier === t.id && isActive}
              onSelect={() => setSelectedTier(t.id)}
            />
          ))}
        </div>

        {/* Pay CTA */}
        <button onClick={handlePay} disabled={paying}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl bg-bt-primary text-white font-bold text-sm disabled:opacity-60 hover:bg-bt-primary-light active:scale-[0.98] transition-all shadow-[0_4px_14px_rgba(10,8,118,0.25)]">
          {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          {paying ? "Preparing payment..." : `Pay ₦${price.toLocaleString()} — ${tier.name}`}
        </button>
        <p className="text-center text-xs text-neutral-400">Card · Bank Transfer · USSD · Mobile Money · Secure via Paystack</p>
      </div>
    );
  };

  const renderManage = () => (
    <div className="space-y-4">
      {sub && (
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-900">Current Plan</p>
            <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold",
              isActive ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500")}>
              {isCancelled ? "Cancelled" : isActive ? "Active" : "Expired"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Tier", activeTier?.name ?? "—"],
              ["Billing", sub.plan === "yearly" ? "Annual" : "Monthly"],
              ["Listing limit", activeTier ? (activeTier.listingLimit === 999 ? "Unlimited" : String(activeTier.listingLimit)) : "3"],
              ["Boost credits", activeTier ? `${activeTier.boostCredits}/month` : "0"],
            ].map(([label, value]) => (
              <div key={label} className="bg-neutral-50 rounded-xl p-3">
                <p className="text-[11px] text-neutral-400 uppercase tracking-wide">{label}</p>
                <p className="font-semibold text-neutral-900 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
          {daysLeft !== null && (
            <div className={cn("flex items-center gap-2 text-xs font-medium rounded-xl px-3 py-2.5",
              daysLeft <= 7 ? "bg-amber-50 text-amber-700" : "bg-neutral-50 text-neutral-500")}>
              <Clock className="w-3.5 h-3.5 shrink-0" />
              {daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining` : "Expired"}
            </div>
          )}
        </div>
      )}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <button onClick={() => setView("plans")}
          className="w-full flex items-center gap-3.5 px-5 py-4 hover:bg-neutral-50 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-bt-primary/8 flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4 text-bt-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-neutral-900">{isActive ? "Change / Upgrade Plan" : "Reactivate Subscription"}</p>
            <p className="text-xs text-neutral-400 mt-0.5">Switch tiers or renew access</p>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-300 shrink-0" />
        </button>
      </div>
    </div>
  );

  const renderCancel = () => (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-700 mb-1">Before you cancel</p>
          <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
            <li>Access continues until {sub?.expiresAt ? new Date(sub.expiresAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" }) : "expiry"}</li>
            <li>Listings above the free limit (3) will be hidden after expiry</li>
            <li>Boost credits will reset to 0 at next cycle</li>
            <li>Premium badge and priority placement will be removed</li>
          </ul>
        </div>
      </div>
      <button onClick={handleCancel} disabled={cancelling}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-red-600 text-white font-bold text-sm disabled:opacity-60 hover:bg-red-700 transition-colors">
        {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
        Confirm Cancellation
      </button>
      <button onClick={() => setView("home")} className="w-full py-3 text-sm font-medium text-neutral-500 hover:text-neutral-700">
        Keep my subscription
      </button>
    </div>
  );

  const TITLES: Record<View, string> = {
    home: "Subscription", plans: "Available Plans", manage: "Manage Subscription", cancel: "Cancel Subscription",
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="sticky top-0 z-30 bg-white border-b border-neutral-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => view === "home" ? router.back() : setView("home")}
            className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors">
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </button>
          <h1 className="text-base font-bold text-neutral-900 flex-1">{TITLES[view]}</h1>
          {isActive && activeTier && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold">
              <Crown className="w-3 h-3 fill-amber-600" /> {activeTier.name}
            </span>
          )}
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-5">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-bt-primary" />
          </div>
        ) : (
          <>
            {view === "home"   && renderHome()}
            {view === "plans"  && renderPlans()}
            {view === "manage" && renderManage()}
            {view === "cancel" && renderCancel()}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Tier Card (collapsible) ──────────────────────────────────────────────────

function TierCard({
  tier, billing, isSelected, isCurrentPlan, onSelect,
}: {
  tier: typeof TIERS[number];
  billing: "monthly" | "yearly";
  isSelected: boolean;
  isCurrentPlan: boolean;
  onSelect: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const price   = billing === "monthly" ? tier.monthlyPrice : tier.yearlyPrice;
  const perMonth = billing === "yearly" ? Math.round(tier.yearlyPrice / 12) : tier.monthlyPrice;
  const hasHighlight = "highlight" in tier && tier.highlight;

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden transition-all",
      isSelected ? `${tier.color} shadow-sm` : "border-neutral-100 bg-white",
      hasHighlight && !isSelected ? "border-amber-200" : ""
    )}>
      {hasHighlight && (
        <div className="bg-amber-400 text-amber-900 text-[10px] font-bold text-center py-1 tracking-wide uppercase">
          Most Popular
        </div>
      )}

      {/* Main row — tap to select */}
      <button onClick={onSelect} className="w-full flex items-center gap-3 p-4 text-left">
        {/* Radio */}
        <div className={cn(
          "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
          isSelected ? "border-bt-primary bg-bt-primary" : "border-neutral-300"
        )}>
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-neutral-900">{tier.name}</p>
            {isCurrentPlan && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">Current</span>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            {tier.listingLimit === 999 ? "Unlimited" : `${tier.listingLimit}`} listings · {tier.boostCredits} boost credits/mo
          </p>
        </div>

        {/* Price */}
        <div className="text-right shrink-0">
          <p className="text-base font-bold text-neutral-900">₦{price.toLocaleString()}</p>
          {billing === "yearly" && (
            <p className="text-[10px] text-neutral-400">₦{perMonth.toLocaleString()}/mo</p>
          )}
        </div>
      </button>

      {/* Expand / collapse features */}
      {isSelected && (
        <div className="px-4 pb-1">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1.5 text-xs font-semibold text-bt-primary mb-2"
          >
            <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-90")} />
            {expanded ? "Hide features" : "See what's included"}
          </button>

          {expanded && (
            <div className="space-y-1.5 pb-3 border-t border-neutral-100 pt-3">
              {tier.features.map((f) => (
                <div key={f} className="flex items-start gap-2 text-xs text-neutral-700">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-base font-bold text-neutral-900 mb-2 px-1">{title}</p>
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm divide-y divide-neutral-50 overflow-hidden">{children}</div>
    </div>
  );
}

function MenuRow({ icon: Icon, label, desc, iconBg = "bg-neutral-100", iconColor = "text-neutral-500", onClick }: {
  icon: React.ComponentType<{ className?: string }>; label: string; desc?: string;
  iconBg?: string; iconColor?: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3.5 px-5 py-4 hover:bg-neutral-50 active:bg-neutral-100 transition-colors text-left">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
        <Icon className={cn("w-4 h-4", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-900">{label}</p>
        {desc && <p className="text-[11px] text-neutral-400 mt-0.5">{desc}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-neutral-300 shrink-0" />
    </button>
  );
}

export default function SubscriptionPage() {
  return <AuthGuard><SubscriptionContent /></AuthGuard>;
}
