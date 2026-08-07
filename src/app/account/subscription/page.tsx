"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Crown, Check, Zap, TrendingUp, Shield, BarChart2,
  Calendar, CreditCard, Receipt, X, Loader2, AlertTriangle,
  ChevronRight, RefreshCw, Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { AuthGuard } from "@/components/auth-guard";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const MONTHLY_PRICE = 5000;
const YEARLY_PRICE  = Math.round(MONTHLY_PRICE * 12 * 0.8);

const FEATURES = [
  { icon: Zap,        label: "Unlimited Listings",  desc: "No 5-property cap" },
  { icon: Crown,      label: "Premium Badge",        desc: "Verified gold crown" },
  { icon: TrendingUp, label: "Priority Placement",   desc: "First in search results" },
  { icon: Shield,     label: "Verified Status",      desc: "Build tenant trust" },
  { icon: BarChart2,  label: "Advanced Analytics",   desc: "Views & saves tracking" },
];

type SubStatus = "active" | "expired" | "cancelled" | "none";
type View = "home" | "plans" | "manage" | "history" | "cancel";

interface SubInfo {
  status: SubStatus;
  plan: "monthly" | "yearly" | null;
  expiresAt: string | null;
  activatedAt: string | null;
  paymentHistory: { date: string; plan: string; amount: number; reference: string }[];
}

function SubscriptionContent() {
  const router = useRouter();
  const [view, setView] = useState<View>("home");
  const [sub, setSub] = useState<SubInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
  const scriptReady = useRef(false);

  useEffect(() => {
    api.get<any>("/v1/user/subscription/status")
      .then((r) => setSub({ status: r.status ?? "none", plan: r.plan, expiresAt: r.expiresAt, activatedAt: r.activatedAt, paymentHistory: r.paymentHistory ?? [] }))
      .catch(() => setSub({ status: "none", plan: null, expiresAt: null, activatedAt: null, paymentHistory: [] }))
      .finally(() => setLoading(false));

    // Preload Paystack
    if (typeof window !== "undefined" && !scriptReady.current) {
      if (!document.querySelector('script[src*="paystack.co/v2/inline"]')) {
        const s = document.createElement("script");
        s.src = "https://js.paystack.co/v2/inline.js";
        s.async = true;
        s.onload = () => { scriptReady.current = true; };
        document.body.appendChild(s);
      } else { scriptReady.current = true; }
    }
  }, []);

  const handlePay = async (plan: "monthly" | "yearly") => {
    setPaying(true);
    try {
      const res = await api.post<any>("/v1/user/subscription/initiate", { plan });
      const PaystackPop = (window as any).PaystackPop;
      if (!PaystackPop) { toast.error("Payment system not ready. Refresh and try again."); setPaying(false); return; }
      const popup = new PaystackPop();
      popup.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "",
        accessCode: res.accessCode,
        onSuccess: () => {
          setPaying(false);
          toast.success("🎉 Premium activated!");
          // Refresh sub status
          api.get<any>("/v1/user/subscription/status").then((r) =>
            setSub({ status: r.status ?? "none", plan: r.plan, expiresAt: r.expiresAt, activatedAt: r.activatedAt, paymentHistory: r.paymentHistory ?? [] })
          ).catch(() => {});
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
    } finally {
      setCancelling(false);
    }
  };

  const isActive = sub?.status === "active";
  const isCancelled = sub?.status === "cancelled";
  const daysLeft = sub?.expiresAt
    ? Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / 86_400_000)
    : null;
  const expiringSoon = isActive && daysLeft !== null && daysLeft <= 7;

  // ── Views ──────────────────────────────────────────────────────────────────

  const renderHome = () => (
    <div className="space-y-4">

      {/* Current status banner */}
      {isActive && sub && (
        <div className={cn(
          "rounded-2xl p-4 border",
          expiringSoon ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              expiringSoon ? "bg-amber-100" : "bg-emerald-100")}>
              <Crown className={cn("w-5 h-5", expiringSoon ? "text-amber-600 fill-amber-600" : "text-emerald-600 fill-emerald-600")} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-neutral-900">
                Premium {sub.plan === "yearly" ? "Annual" : "Monthly"} — Active
              </p>
              <p className={cn("text-xs mt-0.5 flex items-center gap-1",
                expiringSoon ? "text-amber-700" : "text-neutral-500")}>
                <Calendar className="w-3 h-3" />
                {expiringSoon ? `Expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}` : `Renews ${new Date(sub.expiresAt!).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}`}
              </p>
            </div>
            <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold",
              expiringSoon ? "bg-amber-200 text-amber-800" : "bg-emerald-200 text-emerald-800")}>
              Active
            </span>
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
              <p className="text-sm font-bold text-neutral-900">Premium Cancelled</p>
              <p className="text-xs text-neutral-500 mt-0.5">Access until {new Date(sub.expiresAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
          </div>
        </div>
      )}

      {/* Subscription section */}
      <Section title="Subscription">
        <MenuRow icon={Crown} label="Available subscriptions" desc="See plans and pricing" iconBg="bg-amber-50" iconColor="text-amber-500" onClick={() => setView("plans")} />
        {(isActive || isCancelled) && (
          <MenuRow icon={RefreshCw} label="Manage your subscription" desc={isActive ? "Renew or change plan" : "Reactivate premium"} onClick={() => setView("manage")} />
        )}
        {isActive && (
          <MenuRow icon={X} label="Cancel subscription" desc="Stop auto-renewal" iconBg="bg-red-50" iconColor="text-red-500" onClick={() => setView("cancel")} />
        )}
      </Section>

      {/* Payment section */}
      <Section title="Payment">
        <MenuRow icon={Receipt} label="Payment history" desc="Past subscription payments" onClick={() => setView("history")} />
      </Section>
    </div>
  );

  const renderPlans = () => (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500">Choose a plan that works for you.</p>

      {/* Features */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-3">What you get</p>
        <ul className="space-y-3">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <li key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-bt-primary/8 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-bt-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{label}</p>
                <p className="text-xs text-neutral-400">{desc}</p>
              </div>
              <Check className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />
            </li>
          ))}
        </ul>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-2 gap-3">
        {(["monthly", "yearly"] as const).map((p) => {
          const price    = p === "monthly" ? MONTHLY_PRICE : YEARLY_PRICE;
          const perMonth = p === "yearly" ? Math.round(YEARLY_PRICE / 12) : MONTHLY_PRICE;
          const active   = selectedPlan === p;
          return (
            <button key={p} onClick={() => setSelectedPlan(p)}
              className={cn(
                "relative rounded-2xl border p-4 text-left transition-all",
                active ? "border-bt-primary bg-bt-primary/5 shadow-sm" : "border-neutral-200 bg-white hover:border-neutral-300"
              )}>
              {p === "yearly" && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-900 text-[10px] font-bold whitespace-nowrap">
                  Save 20%
                </span>
              )}
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
                {p === "monthly" ? "Monthly" : "Yearly"}
              </p>
              <p className="text-xl font-bold text-neutral-900">₦{price.toLocaleString()}</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {p === "yearly" ? `₦${perMonth.toLocaleString()}/mo` : "per month"}
              </p>
              {active && <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-bt-primary flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
            </button>
          );
        })}
      </div>

      <button onClick={() => handlePay(selectedPlan)} disabled={paying}
        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl bg-bt-primary text-white font-bold text-sm disabled:opacity-60 hover:bg-bt-primary-light active:scale-[0.98] transition-all shadow-[0_4px_14px_rgba(10,8,118,0.25)]">
        {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
        {paying ? "Preparing payment..." : `Pay ₦${(selectedPlan === "monthly" ? MONTHLY_PRICE : YEARLY_PRICE).toLocaleString()}`}
      </button>
      <p className="text-center text-xs text-neutral-400">Card · Bank Transfer · USSD · Mobile Money · Secure via Paystack</p>
    </div>
  );

  const renderManage = () => (
    <div className="space-y-4">
      {sub && (
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-900">Current Plan</p>
            <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold",
              isActive ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500")}>
              {sub.status === "cancelled" ? "Cancelled" : isActive ? "Active" : "Expired"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-neutral-50 rounded-xl p-3">
              <p className="text-[11px] text-neutral-400 uppercase tracking-wide">Plan</p>
              <p className="font-semibold text-neutral-900 mt-0.5 capitalize">{sub.plan ?? "—"}</p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3">
              <p className="text-[11px] text-neutral-400 uppercase tracking-wide">
                {sub.status === "cancelled" ? "Access Until" : "Expires"}
              </p>
              <p className="font-semibold text-neutral-900 mt-0.5">
                {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </p>
            </div>
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
            <p className="text-sm font-semibold text-neutral-900">{isActive ? "Renew / Change Plan" : "Reactivate Premium"}</p>
            <p className="text-xs text-neutral-400 mt-0.5">Pay again to extend access</p>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-300 shrink-0" />
        </button>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-3">
      {!sub?.paymentHistory.length ? (
        <div className="bg-white rounded-2xl border border-neutral-100 p-8 text-center">
          <Receipt className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">No payment history yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm divide-y divide-neutral-50 overflow-hidden">
          {sub.paymentHistory.slice().reverse().map((p, i) => (
            <div key={i} className="flex items-center gap-3.5 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-900 capitalize">{p.plan} plan</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {new Date(p.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  {p.reference && <span className="ml-2 font-mono text-[10px] text-neutral-300">{p.reference.slice(-8)}</span>}
                </p>
              </div>
              <p className="text-sm font-bold text-neutral-900">₦{p.amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCancel = () => (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-700 mb-1">Before you cancel</p>
          <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
            <li>Your premium access continues until {sub?.expiresAt ? new Date(sub.expiresAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" }) : "expiry"}</li>
            <li>Listings above the free limit will be hidden after expiry</li>
            <li>Your premium badge and priority placement will be removed</li>
          </ul>
        </div>
      </div>
      <button onClick={handleCancel} disabled={cancelling}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-red-600 text-white font-bold text-sm disabled:opacity-60 hover:bg-red-700 transition-colors">
        {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
        Confirm Cancellation
      </button>
      <button onClick={() => setView("home")}
        className="w-full py-3 text-sm font-medium text-neutral-500 hover:text-neutral-700">
        Keep my subscription
      </button>
    </div>
  );

  const TITLES: Record<View, string> = {
    home:    "Subscription",
    plans:   "Available Plans",
    manage:  "Manage Subscription",
    history: "Payment History",
    cancel:  "Cancel Subscription",
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-neutral-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => view === "home" ? router.back() : setView("home")}
            className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors">
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </button>
          <h1 className="text-base font-bold text-neutral-900 flex-1">{TITLES[view]}</h1>
          {isActive && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold">
              <Crown className="w-3 h-3 fill-amber-600" /> Premium
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
            {view === "home"    && renderHome()}
            {view === "plans"   && renderPlans()}
            {view === "manage"  && renderManage()}
            {view === "history" && renderHistory()}
            {view === "cancel"  && renderCancel()}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-base font-bold text-neutral-900 mb-2 px-1">{title}</p>
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm divide-y divide-neutral-50 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function MenuRow({ icon: Icon, label, desc, iconBg = "bg-neutral-100", iconColor = "text-neutral-500", onClick }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; desc?: string;
  iconBg?: string; iconColor?: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3.5 px-5 py-4 hover:bg-neutral-50 active:bg-neutral-100 transition-colors text-left">
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
