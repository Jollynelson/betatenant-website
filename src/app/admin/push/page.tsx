"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell, Send, Users, User, Home, Loader2,
  CheckCircle2, ChevronDown, Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// Admin push panel — calls the backend admin push endpoint
// Admin token must be in localStorage as BT_ADMIN_TOKEN

const ADMIN_API = "/api/bt/v1/admin";

function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("BT_ADMIN_TOKEN");
}

async function adminPost(path: string, body: unknown) {
  const token = getAdminToken();
  const res = await fetch(`${ADMIN_API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

async function adminGet(path: string) {
  const token = getAdminToken();
  const res = await fetch(`${ADMIN_API}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

const ROLE_OPTIONS = [
  { value: "all",      label: "Everyone",  icon: Users,  color: "text-bt-primary",   bg: "bg-bt-primary/8" },
  { value: "user",     label: "Tenants",   icon: User,   color: "text-emerald-600",  bg: "bg-emerald-50" },
  { value: "agent",    label: "Agents",    icon: Home,   color: "text-amber-600",    bg: "bg-amber-50" },
  { value: "landlord", label: "Landlords", icon: Home,   color: "text-purple-600",   bg: "bg-purple-50" },
];

const QUICK_TEMPLATES = [
  { title: "New Properties Available 🏠", body: "Fresh listings just dropped in your area. Tap to browse.", url: "/properties" },
  { title: "Verify Your Agent 🔍", body: "Always check an agent before dealing. Use our free agent search.", url: "/agents" },
  { title: "List Your Space 💰", body: "Got a property? List it free on Beta Tenant and reach thousands.", url: "/host/new" },
  { title: "Tenant Switch Live 🔄", body: "Find tenants ready to swap apartments in your area.", url: "/tenant-switch" },
];

export default function AdminPushPage() {
  const router = useRouter();
  const [stats, setStats] = useState<{ total: number; byRole: { _id: string; count: number }[] } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    body: "",
    url: "/",
    targetRole: "all",
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  useEffect(() => {
    // Gate: require admin token in localStorage
    if (!getAdminToken()) {
      router.replace("/auth/login");
      return;
    }
    adminGet("/messaging/push/stats")
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [router]);

  const applyTemplate = (tpl: typeof QUICK_TEMPLATES[0]) => {
    setForm((f) => ({ ...f, title: tpl.title, body: tpl.body, url: tpl.url }));
    setResult(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Title and body are required");
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await adminPost("/messaging/push", form);
      setResult({ sent: res.sent ?? 0, failed: res.failed ?? 0 });
      toast.success(`Sent to ${res.sent} device${res.sent !== 1 ? "s" : ""}`);
      setForm((f) => ({ ...f, title: "", body: "" }));
    } catch (err: any) {
      toast.error(err.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  const remaining = 160 - form.body.length;

  return (
    <div className="min-h-screen bg-bt-surface p-5 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-[-0.02em]">Push Notifications</h1>
          <p className="text-sm text-neutral-500 mt-1">Send native push notifications directly to users' devices</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-neutral-100 p-4 h-[80px] animate-pulse" />
            ))
          ) : (
            ROLE_OPTIONS.map((r) => {
              const count = r.value === "all"
                ? (stats?.total ?? 0)
                : (stats?.byRole?.find((b) => b._id === r.value)?.count ?? 0);
              return (
                <motion.div
                  key={r.value}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-neutral-100 p-4"
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", r.bg)}>
                    <Smartphone className={cn("w-4 h-4", r.color)} />
                  </div>
                  <p className="text-xl font-bold text-neutral-900">{count.toLocaleString()}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{r.label}</p>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Compose */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-50 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-bt-primary/8 flex items-center justify-center">
              <Bell className="w-4 h-4 text-bt-primary" />
            </div>
            <div>
              <p className="font-semibold text-neutral-900 text-sm">Compose Notification</p>
              <p className="text-xs text-neutral-400">Push to selected audience</p>
            </div>
          </div>

          <form onSubmit={handleSend} className="p-5 space-y-4">
            {/* Audience */}
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2 block">Audience</label>
              <div className="grid grid-cols-4 gap-2">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, targetRole: r.value }))}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all",
                      form.targetRole === r.value
                        ? "bg-bt-primary border-bt-primary text-white"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                    )}
                  >
                    <r.icon className="w-4 h-4" />
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick templates */}
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2 block">Quick Templates</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_TEMPLATES.map((t) => (
                  <button
                    key={t.title}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="text-left px-3 py-2.5 rounded-xl border border-neutral-200 hover:border-bt-primary/40 hover:bg-bt-primary/3 transition-all"
                  >
                    <p className="text-xs font-semibold text-neutral-800 truncate">{t.title}</p>
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">{t.body}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Notification title"
                maxLength={65}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary"
              />
              <p className="text-[11px] text-neutral-400 mt-1 text-right">{65 - form.title.length} chars left</p>
            </div>

            {/* Body */}
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="What do you want to tell users?"
                rows={3}
                maxLength={160}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary resize-none"
              />
              <p className={cn("text-[11px] mt-1 text-right", remaining < 20 ? "text-amber-500" : "text-neutral-400")}>
                {remaining} chars left
              </p>
            </div>

            {/* URL */}
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">
                Tap destination
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">betatenant.com</span>
                <input
                  type="text"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="/properties"
                  className="w-full pl-[138px] pr-4 py-3 rounded-xl border border-neutral-200 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary"
                />
              </div>
            </div>

            {/* Preview card */}
            {(form.title || form.body) && (
              <div className="rounded-xl bg-neutral-900 p-4 space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
                    <Bell className="w-3.5 h-3.5 text-bt-primary" />
                  </div>
                  <span className="text-white/50 text-xs">Beta Tenant · now</span>
                </div>
                <p className="text-white font-semibold text-sm">{form.title || "Title preview"}</p>
                <p className="text-white/70 text-xs leading-relaxed">{form.body || "Body preview"}</p>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-700 font-medium">
                  Delivered to <strong>{result.sent}</strong> device{result.sent !== 1 ? "s" : ""}
                  {result.failed > 0 && ` · ${result.failed} failed (stale subscriptions removed)`}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={sending || !form.title.trim() || !form.body.trim()}
              className="w-full py-3.5 rounded-full bg-bt-primary text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-bt-primary-light transition-colors disabled:opacity-50 shadow-[0_2px_8px_rgba(10,8,118,0.2)]"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending
                ? "Sending…"
                : `Send to ${ROLE_OPTIONS.find((r) => r.value === form.targetRole)?.label ?? "Everyone"}`}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
