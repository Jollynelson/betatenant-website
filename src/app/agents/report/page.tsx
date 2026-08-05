"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Phone, UserCircle, ThumbsUp, ThumbsDown, Star,
  ShieldCheck, UserX, ArrowLeft, Loader2,
  CircleDollarSign, Clock, HeartHandshake, House, Laugh,
  ScrollText, UserCheck, Zap, ShieldAlert, Ghost, Ban,
  CreditCard, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { AuthGuard } from "@/components/auth-guard";
import toast from "react-hot-toast";

const POSITIVE_CHIPS = [
  { category: "professional",     icon: UserCheck },
  { category: "punctual",         icon: Clock },
  { category: "transparent",      icon: ScrollText },
  { category: "fair fees",        icon: CircleDollarSign },
  { category: "verified listing", icon: House },
  { category: "very helpful",     icon: HeartHandshake },
  { category: "fast response",    icon: Zap },
  { category: "other good exp",   icon: Laugh },
];

const NEGATIVE_CHIPS = [
  { category: "viewing fee fraud", icon: ShieldAlert },
  { category: "fake listing",      icon: Ghost },
  { category: "rude behavior",     icon: Ghost },
  { category: "ghosted",           icon: Ban },
  { category: "late arrival",      icon: Clock },
  { category: "bad condition",     icon: House },
  { category: "refused refund",    icon: CreditCard },
  { category: "other issue",       icon: AlertCircle },
];

const RATING_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Terrible",  color: "text-red-500" },
  2: { label: "Poor",      color: "text-orange-500" },
  3: { label: "Average",   color: "text-bt-primary" },
  4: { label: "Good",      color: "text-emerald-400" },
  5: { label: "Excellent", color: "text-emerald-600" },
};

function ReportAgentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const phoneParam   = searchParams.get("phone") || "";
  const nameParam    = searchParams.get("name") || "";
  const registered   = searchParams.get("registered") === "true";

  const [form, setForm] = useState({
    agentName:       nameParam,
    phone:           phoneParam.replace("+234", "0"),
    rating:          3,
    positives:       [] as string[],
    negatives:       [] as string[],
    report:          "",
    postAnonymously: false,
  });

  const [errors, setErrors] = useState({ name: "", category: "" });
  const [loading, setLoading] = useState(false);

  // Redirect if no phone provided
  useEffect(() => {
    if (!phoneParam) router.replace("/agents");
  }, [phoneParam, router]);

  const toggleChip = (category: string, type: "positive" | "negative") => {
    if (type === "positive") {
      setForm((f) => ({
        ...f,
        positives: f.positives.includes(category)
          ? f.positives.filter((c) => c !== category)
          : [...f.positives, category],
      }));
    } else {
      setForm((f) => ({
        ...f,
        negatives: f.negatives.includes(category)
          ? f.negatives.filter((c) => c !== category)
          : [...f.negatives, category],
      }));
    }
  };

  const validate = () => {
    const e = { name: "", category: "" };
    if (!form.agentName || form.agentName.trim().length < 2)
      e.name = "Please enter a valid agent name";
    if (form.positives.length === 0 && form.negatives.length === 0)
      e.category = "Please select at least one highlight or issue";
    setErrors(e);
    return !e.name && !e.category;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const rawPhone = encodeURIComponent(phoneParam);
      await api.post(`/v1/user/${rawPhone}/reports`, {
        agentName:       form.agentName,
        rating:          form.rating,
        positives:       form.positives,
        negatives:       form.negatives,
        report:          form.report,
        postAnonymously: form.postAnonymously,
      });
      toast.success("Thank you for sharing your experience. Your feedback helps build a safer rental community in Nigeria.");
      setTimeout(() => router.push(`/agents?phone=${encodeURIComponent(phoneParam)}`), 2000);
    } catch (err: any) {
      if (err.message?.includes("already have a report")) {
        toast.error("You have already submitted a report for this agent.");
      } else {
        toast.error(err.message || "An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!phoneParam) return null;

  return (
    <div className="min-h-screen bg-bt-surface py-10">
      <div className="max-w-xl mx-auto px-5">
        {/* Back */}
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to search
        </Link>

        <div className="text-center mb-6">
          <Link href="/">
            <Image src="/images/bt_logo_big.svg" alt="Beta Tenant" width={130} height={34} className="h-8 w-auto mx-auto mb-4" />
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-neutral-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden"
        >
          {/* Info banner */}
          <div className={cn(
            "flex items-start gap-3 p-4 border-b",
            form.rating > 3 ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"
          )}>
            {form.rating > 3
              ? <ThumbsUp className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              : <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            }
            <p className={cn("text-sm", form.rating > 3 ? "text-emerald-700" : "text-amber-700")}>
              Please select all tags that apply to your interaction. You can select both positive highlights and issues encountered.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Agent name + phone row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">Agent Name</label>
                <div className="relative">
                  <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={form.agentName}
                    disabled={!!nameParam}
                    onChange={(e) => setForm({ ...form, agentName: e.target.value })}
                    placeholder="Enter agent's name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary disabled:text-neutral-400 disabled:bg-neutral-50"
                  />
                </div>
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">Agent Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={form.phone}
                    disabled
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 text-[16px] text-neutral-400 bg-neutral-50"
                  />
                </div>
              </div>
            </div>

            {/* Verified status */}
            <div className="flex items-center gap-2">
              {registered ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  Verified Registered Agent
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm text-red-500 font-semibold">
                  <UserX className="w-4 h-4" />
                  Unverified User
                </span>
              )}
            </div>

            {/* Star rating */}
            <div className="rounded-xl border border-neutral-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Experience Rating</span>
                <span className={cn("text-sm font-semibold", RATING_LABELS[form.rating].color)}>
                  {RATING_LABELS[form.rating].label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm({ ...form, rating: v })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={cn(
                        "w-7 h-7 transition-all",
                        v <= form.rating ? "fill-amber-400 text-amber-400" : "text-neutral-200"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Positive chips */}
            <div className="rounded-xl border border-neutral-100 p-4 space-y-3">
              <div className="flex items-center gap-1.5">
                <ThumbsUp className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-600">Highlights (Positives)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {POSITIVE_CHIPS.map((chip) => {
                  const selected = form.positives.includes(chip.category);
                  return (
                    <button
                      key={chip.category}
                      type="button"
                      onClick={() => toggleChip(chip.category, "positive")}
                      className={cn(
                        "flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full border text-sm font-medium transition-all capitalize",
                        selected
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
                      )}
                    >
                      <span className={cn("w-6 h-6 rounded-full flex items-center justify-center", selected ? "bg-white/20" : "bg-neutral-100")}>
                        <chip.icon className={cn("w-3.5 h-3.5", selected ? "text-white" : "text-neutral-500")} />
                      </span>
                      {chip.category}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Negative chips */}
            <div className="rounded-xl border border-neutral-100 p-4 space-y-3">
              <div className="flex items-center gap-1.5">
                <ThumbsDown className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-500">Issues (Negatives)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {NEGATIVE_CHIPS.map((chip) => {
                  const selected = form.negatives.includes(chip.category);
                  return (
                    <button
                      key={chip.category}
                      type="button"
                      onClick={() => toggleChip(chip.category, "negative")}
                      className={cn(
                        "flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full border text-sm font-medium transition-all capitalize",
                        selected
                          ? "bg-red-500 border-red-500 text-white"
                          : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
                      )}
                    >
                      <span className={cn("w-6 h-6 rounded-full flex items-center justify-center", selected ? "bg-white/20" : "bg-neutral-100")}>
                        <chip.icon className={cn("w-3.5 h-3.5", selected ? "text-white" : "text-neutral-500")} />
                      </span>
                      {chip.category}
                    </button>
                  );
                })}
              </div>
              {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">
                Detailed Description <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={4}
                value={form.report}
                onChange={(e) => setForm({ ...form, report: e.target.value })}
                placeholder="Share the full story. Your detailed feedback is valuable to other tenants."
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary resize-none"
              />
            </div>

            {/* Anonymous option — only for registered agents */}
            {registered && (
              <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.postAnonymously}
                  onChange={(e) => setForm({ ...form, postAnonymously: e.target.checked })}
                  className="w-4 h-4 accent-bt-secondary cursor-pointer"
                />
                <span className="text-neutral-500">Post Anonymously</span>
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-bt-primary text-white font-semibold hover:bg-bt-primary-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Submitting..." : "Submit Report"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default function ReportAgentPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-bt-primary" /></div>}>
        <ReportAgentContent />
      </Suspense>
    </AuthGuard>
  );
}
