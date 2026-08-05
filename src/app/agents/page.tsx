"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  Shield, Star, Phone, MapPin, CheckCircle2, AlertTriangle,
  ShieldCheck, Loader2, Search, ThumbsUp, ThumbsDown, UserCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import toast from "react-hot-toast";

type ResultState =
  | { type: "agent"; data: any }
  | { type: "no-reports"; phone: string }
  | { type: "reports-only"; data: any }
  | null;

const RISK_STYLES: Record<string, { border: string; bg: string; badge: string }> = {
  LOW:      { border: "border-emerald-200", bg: "bg-emerald-50",  badge: "bg-emerald-600" },
  MODERATE: { border: "border-neutral-200", bg: "bg-neutral-50",  badge: "bg-neutral-600" },
  HIGH:     { border: "border-red-200",     bg: "bg-red-50",      badge: "bg-red-600" },
};

const mockTopAgents = [
  { id: "1", name: "Adebayo Ogundimu",  avatar: "AO", rating: 4.8, positiveReports: 42, negativeReports: 3,  totalDeals: 89,  listingCount: 12, speciality: "Lekki & VI",       isVerified: true },
  { id: "2", name: "Funke Adekunle",    avatar: "FA", rating: 4.9, positiveReports: 67, negativeReports: 1,  totalDeals: 134, listingCount: 8,  speciality: "Ikoyi & VI",       isVerified: true },
  { id: "3", name: "Ibrahim Musa",      avatar: "IM", rating: 4.6, positiveReports: 28, negativeReports: 5,  totalDeals: 56,  listingCount: 15, speciality: "Ikeja & Magodo",   isVerified: true },
  { id: "4", name: "Ngozi Eze",         avatar: "NE", rating: 4.7, positiveReports: 51, negativeReports: 4,  totalDeals: 102, listingCount: 20, speciality: "Mainland Lagos",   isVerified: true },
];

export default function AgentsPage() {
  const [phone, setPhone] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultState>(null);
  const hasSearchedRef = useRef(false);

  const doSearch = useCallback(async (phoneValue: string) => {
    setLoading(true);
    setResult(null);
    try {
      const clean = phoneValue.replace("+", "");
      const data = await api.get<any>(`/v1/user/search?phoneNumber=${clean}`);

      if (data?.profile) {
        setResult({ type: "agent", data: data.profile });
      } else if (data?.reports) {
        setResult({ type: "reports-only", data });
      } else {
        setResult({ type: "no-reports", phone: clean });
      }
    } catch {
      toast.error("Search failed. Please try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fire when phone becomes valid — exactly like live site
  useEffect(() => {
    const valid = phone ? isValidPhoneNumber(phone) : false;

    if (valid && !hasSearchedRef.current && !loading) {
      hasSearchedRef.current = true;
      doSearch(phone);
    }

    if (!valid) {
      hasSearchedRef.current = false;
      if (!phone) setResult(null);
    }
  }, [phone, loading, doSearch]);

  return (
    <div className="min-h-screen bg-bt-surface">
      {/* Hero / Search */}
      <div className="bg-white border-b border-neutral-100 pt-10 pb-14 md:pt-16 md:pb-20">
        <div className="max-w-xl mx-auto px-5 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bt-primary/8 text-bt-primary text-sm font-semibold mb-5">
            <Shield className="w-4 h-4" />
            Agent Trust System
          </div>
          <h1 className="text-[26px] sm:text-[32px] font-bold text-neutral-900 tracking-[-0.02em] mb-3">
            Identify an Agent
          </h1>
          <p className="text-neutral-500 max-w-md mx-auto mb-8 leading-relaxed">
            Check that agent — enter a phone number. Don&apos;t rent blind. Search any
            agent&apos;s number and see reviews, reports, and verification status instantly.
          </p>

          {/* Phone input — auto-fires on valid number */}
          <div className="flex items-center border border-neutral-200 bg-white rounded-full pr-2 shadow-[0_4px_20px_rgba(0,0,0,0.06)] focus-within:shadow-[0_4px_20px_rgba(10,8,118,0.1)] focus-within:border-bt-primary/30 transition-all max-w-md mx-auto">
            <PhoneInput
              defaultCountry="NG"
              international
              countryCallingCodeEditable={false}
              placeholder="Enter agent phone number"
              value={phone}
              onChange={(v) => setPhone(v ?? "")}
              disabled={loading}
              className="flex-1 phone-input-bt"
            />
            <div className={cn(
              "rounded-full p-2.5 shrink-0 transition-colors",
              loading ? "bg-neutral-200" : "bg-bt-secondary"
            )}>
              {loading
                ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                : <Search className="w-5 h-5 text-white" />
              }
            </div>
          </div>

          <p className="text-xs text-neutral-400 mt-3">
            Results appear automatically once a valid number is entered
          </p>

          {/* Result cards */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key={result.type}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-8 text-left"
              >
                {result.type === "agent" && <AgentFoundCard profile={result.data} phone={phone} />}
                {result.type === "no-reports" && <NoReportsCard phone={phone} onReset={() => { setPhone(""); setResult(null); }} />}
                {result.type === "reports-only" && <ReportsOnlyCard data={result.data} phone={phone} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Top Rated Agents */}
      <div className="max-w-[1360px] mx-auto px-5 lg:px-10 py-12 md:py-16">
        <h2 className="text-xl font-bold text-neutral-900 mb-6 tracking-[-0.02em]">
          Top Rated Agents
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockTopAgents.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <TopAgentCard agent={agent} />
            </motion.div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .phone-input-bt {
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 8px;
          flex: 1;
        }
        .phone-input-bt .PhoneInputCountry {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .phone-input-bt .PhoneInputCountrySelect {
          background: transparent;
          border: none;
          outline: none;
          font-size: 16px;
          cursor: pointer;
        }
        .phone-input-bt .PhoneInputInput {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-family: "Satoshi", sans-serif;
          font-size: 16px;
          font-weight: 500;
          color: #0c111d;
          padding: 14px 0;
        }
        .phone-input-bt .PhoneInputInput::placeholder {
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}

/* ── Agent Found ── */
function AgentFoundCard({ profile, phone }: { profile: any; phone: string }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);

  const initials = `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase();
  const displayPhone = (profile.phoneNumber ?? phone).replace("234", "0");
  const isVerified = profile.userVerified || profile.userVerificationObject?.status === "verified";
  const isPremium = profile.userSubscriptionObject?.status === "active";

  const handleViewProfile = async () => {
    setLoadingPortfolio(true);
    try {
      const res = await api.post<any>(`/v1/landlordandagent/share/default/${profile._id}`, {});
      const shareId = res.shareID || res.shareId || res.data?.shareID;
      if (shareId) {
        const slug = `${profile.firstName?.toLowerCase()}-${profile.lastName?.toLowerCase()}`;
        router.push(`/agents/portfolio/${shareId}`);
      } else {
        toast.error("Could not load profile");
      }
    } catch {
      toast.error("Could not load profile. Please try again.");
    } finally {
      setLoadingPortfolio(false);
    }
  };

  const handleReport = () => {
    if (!user) {
      toast.error("Please sign in to submit a report.", { duration: 3000 });
      router.push(`/auth/login`);
      return;
    }
    const params = new URLSearchParams({
      phone,
      name: `${profile.firstName} ${profile.lastName}`,
      registered: "true",
    });
    router.push(`/agents/report?${params.toString()}`);
  };

  const ratingVal = profile.agentStats?.rating?.averageRating
    ?? profile.agentStats?.rating
    ?? null;

  return (
    <div className={cn(
      "rounded-2xl bg-white p-5 space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]",
      isVerified ? "border-2 border-bt-success" : "border border-neutral-200"
    )}>
      {/* Verified banner */}
      {isVerified && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bt-success/8 border border-bt-success/20">
          <ShieldCheck className="w-4 h-4 text-bt-success shrink-0" />
          <p className="text-sm font-semibold text-bt-success">BT Verified Agent</p>
          <span className="ml-auto text-xs text-bt-success/70">Identity confirmed</span>
        </div>
      )}

      {/* Identity row */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          {profile.profilePic ? (
            <div className={cn("w-16 h-16 rounded-full overflow-hidden border-2", isVerified ? "border-bt-success/30" : "border-neutral-100")}>
              <Image src={profile.profilePic} alt={profile.firstName} width={64} height={64} className="object-cover w-full h-full" />
            </div>
          ) : (
            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold", isVerified ? "bg-bt-success/8 text-bt-success" : "bg-bt-primary/8 text-bt-primary")}>
              {initials}
            </div>
          )}
          {isVerified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-bt-success border-2 border-white flex items-center justify-center">
              <ShieldCheck className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-bold text-neutral-900 capitalize">
              {profile.firstName} {profile.lastName}
            </p>
            {isVerified && (
              <ShieldCheck className="w-4 h-4 text-bt-success shrink-0" />
            )}
          </div>
          <p className="text-sm text-neutral-500 capitalize mt-0.5">{profile.role}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400 flex-wrap">
            {profile.agentBasedLocation && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />{profile.agentBasedLocation}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />{displayPhone}
            </span>
          </div>
        </div>
      </div>

      <hr className="border-neutral-100" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Rating",     value: ratingVal != null ? Number(ratingVal).toFixed(1) : "—" },
          { label: "Yrs Exp",    value: profile.yearsOfRentalExperience ? `${profile.yearsOfRentalExperience}+` : "—" },
          { label: "Listings",   value: profile.agentStats?.activeListings ?? "—" },
        ].map((s) => (
          <div key={s.label} className="text-center py-3 rounded-xl bg-neutral-50">
            <p className="font-bold text-neutral-900 text-sm">{s.value}</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleViewProfile}
          disabled={loadingPortfolio}
          className="flex-1 py-3 rounded-full bg-bt-primary text-white font-semibold text-sm hover:bg-bt-primary-light transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loadingPortfolio ? <><Loader2 className="w-4 h-4 animate-spin" />Loading...</> : "View Full Profile"}
        </button>
        <button
          onClick={handleReport}
          className="flex-1 py-3 rounded-full border border-red-400 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors"
        >
          Report Agent
        </button>
      </div>
    </div>
  );
}

/* ── No profile, No reports ── */
function NoReportsCard({ phone, onReset }: { phone: string; onReset: () => void }) {
  const router = useRouter();
  return (
    <div className="rounded-2xl border-2 border-bt-primary bg-white p-6 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
      </div>
      <div>
        <h3 className="font-bold text-lg text-neutral-900 mb-1">No Reports Found</h3>
        <p className="text-sm text-neutral-500 leading-relaxed">
          This number is not in our verified database and has zero community reports.
          It appears clean — but always stay vigilant.
        </p>
      </div>
      <button
        onClick={onReset}
        className="w-full py-3 rounded-full bg-bt-primary text-white font-semibold text-sm hover:bg-bt-primary-light transition-colors"
      >
        Check Another Number
      </button>
      <button
        onClick={() => router.push(`/agents/report?phone=${encodeURIComponent(phone)}`)}
        className="w-full py-3 rounded-full border border-neutral-200 text-neutral-600 font-medium text-sm hover:bg-neutral-50 transition-colors"
      >
        Report This Number Anyway
      </button>
    </div>
  );
}

/* ── Reports exist, no BT profile ── */
function ReportsOnlyCard({ data, phone }: { data: any; phone: string }) {
  const risk: string = data.riskLevel ?? "MODERATE";
  const styles = RISK_STYLES[risk] ?? RISK_STYLES.MODERATE;
  const displayPhone = (data.agentPhoneNumber ?? "").replace("234", "0");

  return (
    <div className="rounded-2xl border-2 border-neutral-200 bg-white p-5 space-y-5">
      {/* Unverified badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold border border-red-200">
          <AlertTriangle className="w-3.5 h-3.5" />
          Not Verified on BetaTenant
        </span>
      </div>

      {/* Identity row */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 border-4 border-white shadow shrink-0">
          <Phone className="w-8 h-8" />
        </div>
        <div className="space-y-1.5 text-center sm:text-left w-full">
          <p className="text-xl font-bold text-neutral-900 capitalize">
            {data.stats?.agentName || "Unknown"}
          </p>
          <p className="text-sm text-neutral-500">{displayPhone}</p>
          {/* Category chips */}
          {data.topCategories?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
              {data.topCategories.map((chip: any, i: number) => (
                <span
                  key={i}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white",
                    chip.type === "negative" ? "bg-red-500" : "bg-emerald-500"
                  )}
                >
                  <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px] font-bold">
                    {chip.count}
                  </span>
                  {chip.category}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Claim box */}
      <div className="rounded-xl border-2 border-neutral-200 p-4 text-center space-y-3 bg-neutral-50">
        <div className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-neutral-700" />
          <p className="font-semibold text-neutral-900 text-sm">Is this you?</p>
        </div>
        <p className="text-xs text-neutral-500 leading-relaxed">
          Claim this profile to verify your identity, reveal your number, and manage reviews.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button className="flex-1 py-2.5 rounded-full border-2 border-neutral-300 text-neutral-600 font-medium text-sm hover:bg-neutral-100 transition-colors">
            Respond to reviews
          </button>
          <button className={cn("flex-1 py-2.5 rounded-full text-white font-semibold text-sm transition-colors", styles.badge, "hover:opacity-90")}>
            Claim account
          </button>
        </div>
      </div>

      {/* Community reports */}
      <div className={cn("rounded-xl border-2 p-4 space-y-4", styles.border, styles.bg)}>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-neutral-900 text-sm">
            Community Reports ({data.stats?.rating?.totalRatings ?? 0})
          </p>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn("w-3.5 h-3.5", i < Math.round(data.stats?.rating?.averageRating ?? 0) ? "fill-amber-400 text-amber-400" : "text-neutral-300")}
              />
            ))}
            <span className="text-xs text-neutral-500 ml-1">{data.stats?.rating?.averageRating?.toFixed(1)}</span>
          </div>
        </div>

        {data.reports?.slice(0, 5).map((report: any, i: number) => (
          <div key={i} className="bg-white rounded-xl p-4 space-y-2 border border-white">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-900">{report.displayName ?? "Anonymous"}</p>
              <p className="text-xs text-neutral-400">{report.daysAgo}</p>
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} className={cn("w-3 h-3", j < report.rating ? "fill-amber-400 text-amber-400" : "text-neutral-200")} />
              ))}
            </div>
            {report.comment && <p className="text-sm text-neutral-500 leading-relaxed">{report.comment}</p>}
          </div>
        ))}
      </div>

      <button className="w-full py-3 rounded-full bg-bt-primary text-white font-semibold text-sm hover:bg-bt-primary-light transition-colors">
        Add Your Report
      </button>
    </div>
  );
}

/* ── Top Agent Card ── */
function TopAgentCard({ agent }: { agent: typeof mockTopAgents[0] }) {
  const trustScore = Math.round(
    (agent.positiveReports / (agent.positiveReports + agent.negativeReports)) * 100
  );
  return (
    <div className="p-5 rounded-2xl bg-white border border-neutral-100 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-bt-primary/8 flex items-center justify-center text-bt-primary font-bold text-base shrink-0">
          {agent.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-neutral-900 truncate text-sm">{agent.name}</p>
            {agent.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-bt-success shrink-0" />}
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">{agent.speciality}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-sm font-semibold text-neutral-900">{agent.rating}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 py-3 border-t border-neutral-100">
        <div className="text-center">
          <p className="text-sm font-bold text-emerald-600">{trustScore}%</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">Trust</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-neutral-900">{agent.totalDeals}</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">Deals</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-neutral-900">{agent.listingCount}</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">Listings</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-neutral-100">
        <div className="flex items-center gap-1 text-xs text-emerald-600">
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>{agent.positiveReports}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-red-500">
          <ThumbsDown className="w-3.5 h-3.5" />
          <span>{agent.negativeReports}</span>
        </div>
      </div>
    </div>
  );
}
