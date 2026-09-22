"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Copy, Check, Share2, Gift, Users, Sparkles,
  Zap, ExternalLink, ChevronRight, CheckCircle2, AlertCircle,
  MessageCircle, Loader2, Wallet, Briefcase, Clock, DollarSign,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { referralApi, ReferralSummary } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

function ReferralsContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReferralSummary | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Claim referral code state
  const [claimCode, setClaimCode] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await referralApi.getSummary();
      setData(res);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load referral details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Effective referral code (from API or auth state)
  const referralCode = data?.referralCode || user?.referralCode || "";

  // Dynamic origin-based signup link
  const getSignupUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/auth/signup?ref=${encodeURIComponent(referralCode)}`;
    }
    return data?.registerUrl || `https://betatenant.com/auth/signup?ref=${encodeURIComponent(referralCode)}`;
  };

  const handleCopyCode = () => {
    if (!referralCode) {
      toast.error("Referral code is loading...");
      return;
    }
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    toast.success("Referral code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const url = getSignupUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!referralCode) {
      toast.error("Please wait a moment for your referral code to load.");
      return;
    }

    const signupUrl = getSignupUrl();
    const shareMessage =
      `Find verified apartments, flats, and rooms with zero broker hassle on Beta Tenant!\n\n` +
      `Sign up with my referral code *${referralCode}* to get bonus free property unlock views:\n` +
      `${signupUrl}`;

    // Direct WhatsApp API link - works reliably on mobile app & desktop WhatsApp Web
    const targetUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const handleClaimCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimCode.trim()) return;
    setClaimLoading(true);
    try {
      const res = await referralApi.applyCode(claimCode.trim(), "web");
      if (res.successful) {
        toast.success(res.message || "Referral code claimed! Free views added.");
        setClaimSuccess(true);
        setClaimCode("");
        fetchSummary();
      } else {
        toast.error(res.errorMessage || "Could not apply referral code.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to apply referral code.");
    } finally {
      setClaimLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-bt-primary" />
      </div>
    );
  }

  const stats = data?.stats || {
    totalReferred: 0,
    totalRewarded: 0,
    freeViewsEarned: 0,
    boostCreditsEarned: 0,
    walletBonusEarned: 0,
    commissionEarned: 0,
    agentReferralsCount: 0,
  };

  const referrals = data?.referrals || [];
  const walletBalance = data?.currentBalance?.userBalance || 0;
  const cashCommissionEarned = stats.commissionEarned || stats.walletBonusEarned || 0;

  return (
    <div className="min-h-screen bg-bt-surface pb-16">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">

        {/* Back navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/account")}
            className="w-9 h-9 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Refer & Earn</h1>
            <p className="text-xs text-neutral-500">Invite tenants & agents to unlock rewards & cash</p>
          </div>
        </div>

        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-bt-primary via-[#1c1c9c] to-bt-primary-light text-white p-6 shadow-md">
          <div className="relative z-10 space-y-3.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold text-white">
                <Gift className="w-3.5 h-3.5 text-amber-300" /> Give 2 views, Get 3 views
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/25 border border-amber-300/40 text-xs font-bold text-amber-200">
                <DollarSign className="w-3.5 h-3.5 text-amber-300" /> 10% Agent Commission
              </span>
            </div>

            <h2 className="text-2xl font-black leading-tight tracking-tight">
              Earn free views and cash commissions on every invite
            </h2>
            <p className="text-xs text-blue-100/90 leading-relaxed max-w-sm">
              Your friends get <strong className="text-white">+2 free unlock views</strong>. When you invite an agent, you also earn <strong className="text-white">10% cash</strong> every time they perform a transaction for 4 months!
            </p>

            {/* Prominent Referral Code Box */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] uppercase tracking-wider text-blue-200 font-bold">Your Referral Code</p>
                <span className="text-[10px] text-blue-200/80">Tap code to copy</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/20 flex items-center justify-between gap-3 shadow-inner">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex-1 text-left px-2 py-1 cursor-pointer group"
                  title="Click to copy code"
                >
                  <span className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-white block group-hover:text-amber-200 transition-colors">
                    {referralCode || "..."}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 text-xs font-bold bg-white text-bt-primary px-4 py-2.5 rounded-xl hover:bg-blue-50 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copiedCode ? "Copied!" : "Copy Code"}
                </button>
              </div>
            </div>

            {/* 1-Tap Share Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                Share to WhatsApp
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-[0.98] text-white font-bold text-xs border border-white/25 transition-all cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
                {copiedLink ? "Link Copied!" : "Copy Link"}
              </button>
            </div>
          </div>

          {/* Decorative background blur rings */}
          <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-32 h-32 rounded-full bg-blue-400/20 blur-xl pointer-events-none" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-neutral-100 p-4 shadow-sm text-center space-y-1">
            <p className="text-2xl font-black text-neutral-900">{stats.totalReferred}</p>
            <p className="text-xs text-neutral-500 font-medium">Friends Invited</p>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-100 p-4 shadow-sm text-center space-y-1">
            <p className="text-2xl font-black text-emerald-600">{stats.totalRewarded}</p>
            <p className="text-xs text-neutral-500 font-medium">Joined & Active</p>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl border border-neutral-100 p-4 shadow-sm text-center space-y-1">
            <p className="text-2xl font-black text-bt-primary">+{stats.freeViewsEarned}</p>
            <p className="text-xs text-neutral-500 font-medium">Free Views Earned</p>
          </div>
        </div>

        {/* Agent Revenue Commission Program Card */}
        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent rounded-2xl border border-amber-200/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Agent Commission Program</h3>
                <p className="text-[11px] text-neutral-500">10% cash on every transaction for 4 months</p>
              </div>
            </div>
            <span className="text-xs font-black text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
              4 Months
            </span>
          </div>

          <p className="text-xs text-neutral-600 leading-relaxed">
            Whether you are a tenant or an agent: when you invite an agent or landlord with your code, you automatically receive <strong className="text-neutral-900">10% of every transaction</strong> they make (subscriptions, boost credits, listings) for their first 4 months! Earnings are credited directly to your cash wallet.
          </p>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="bg-white rounded-xl p-3 border border-amber-100 shadow-xs">
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">Cash Commissions</p>
              <p className="text-base font-black text-emerald-600 mt-0.5">₦{cashCommissionEarned.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-amber-100 shadow-xs">
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">Current Wallet Balance</p>
              <p className="text-base font-black text-neutral-900 mt-0.5">₦{walletBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Current Balance Reminder - "Use now" takes to Tenant Switch */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bt-primary/10 flex items-center justify-center text-bt-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-400 font-medium">Your Current Unlock Balance</p>
              <p className="text-base font-bold text-neutral-900">
                {data?.currentBalance?.freeViewCount ?? 0} Free Property Views Available
              </p>
            </div>
          </div>
          <Link
            href="/tenant-switch"
            className="text-xs font-bold text-bt-primary hover:underline flex items-center gap-1 bg-bt-primary/10 px-3 py-1.5 rounded-xl hover:bg-bt-primary/20 transition-colors shrink-0"
          >
            Use now <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Claim Code Section (If user joined without code) */}
        {!claimSuccess && (
          <div className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-bt-primary" />
              <h3 className="text-sm font-bold text-neutral-900">Were you invited by a friend?</h3>
            </div>
            <p className="text-xs text-neutral-500">
              If you forgot to enter a referral code when registering, enter it below to claim your +2 bonus free property views.
            </p>
            <form onSubmit={handleClaimCode} className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Enter referral code (e.g. BT-XXXX)"
                value={claimCode}
                onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                className="flex-1 rounded-xl border border-neutral-200 px-3.5 py-2.5 text-xs font-mono uppercase tracking-wider outline-none focus:border-bt-primary"
              />
              <button
                type="submit"
                disabled={claimLoading || !claimCode.trim()}
                className="px-5 py-2.5 rounded-xl bg-bt-primary text-white text-xs font-bold hover:bg-bt-primary-light transition-colors disabled:opacity-50 cursor-pointer"
              >
                {claimLoading ? "Applying..." : "Claim Views"}
              </button>
            </form>
          </div>
        )}

        {/* Invited Friends List */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900">
              Referral History ({referrals.length})
            </h3>
            <span className="text-[11px] text-neutral-400 font-medium">
              +{data?.rewards?.referrerBenefit || "+3 views per friend"}
            </span>
          </div>

          {referrals.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-neutral-700">No referrals yet</p>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                Share your unique code on WhatsApp or copy the invite link to start earning free property views & agent cash commissions!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {referrals.map((item) => {
                const displayName = item.refereeName || item.name || "Member";
                const isAgent = item.isAgent || item.role === "agent" || item.role === "landlord";
                const commission = item.totalCommissionEarned || 0;

                return (
                  <div key={item.id} className="px-5 py-3.5 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-neutral-900 capitalize">{displayName}</p>
                        {isAgent ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 text-[9px] font-bold">
                            Agent
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-600 text-[9px] font-medium">
                            Tenant
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        Joined {new Date(item.joinedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      {isAgent && (
                        <p className="text-[10px] text-amber-600 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3" />
                          {item.isCommissionValid
                            ? `10% commission active (${item.daysRemaining} days left)`
                            : "4-month commission period completed"}
                        </p>
                      )}
                    </div>

                    <div className="text-right space-y-1">
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> +{item.rewardGiven} Views
                      </span>
                      {commission > 0 && (
                        <p className="text-[11px] font-bold text-emerald-600">
                          +₦{commission.toLocaleString()} cash
                        </p>
                      )}
                      <p className="text-[10px] text-neutral-400 capitalize">{item.status}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function ReferralsPage() {
  return (
    <AuthGuard>
      <ReferralsContent />
    </AuthGuard>
  );
}
