"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Plus, Trash2, MapPin, Home, DollarSign, Loader2, BellOff, ChevronDown } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { api } from "@/lib/api";
import { NIGERIAN_STATES, APARTMENT_TYPES } from "@/lib/constants";
import { PushToggle } from "@/components/push-subscribe";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Alert {
  _id: string;
  filters: {
    propertyState?: string;
    propertyLGA?: string;
    propertyType?: string;
    maxPrice?: number;
    minPrice?: number;
    roomCount?: number;
  };
  frequency: "instant" | "daily" | "weekly";
  active: boolean;
  lastNotifiedAt?: string;
  createdAt: string;
}

function AlertsContent() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    propertyState: "",
    propertyLGA: "",
    propertyType: "",
    minPrice: "",
    maxPrice: "",
    frequency: "daily" as "instant" | "daily" | "weekly",
  });

  useEffect(() => {
    api.get<any>("/v1/user/alerts")
      .then((r) => setAlerts(r.alerts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.propertyState) {
      toast.error("Please select at least a state");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        filters: {
          propertyState: form.propertyState || undefined,
          propertyLGA: form.propertyLGA || undefined,
          propertyType: form.propertyType || undefined,
          minPrice: form.minPrice ? Number(form.minPrice.replace(/,/g, "")) : undefined,
          maxPrice: form.maxPrice ? Number(form.maxPrice.replace(/,/g, "")) : undefined,
        },
        frequency: form.frequency,
      };
      const res = await api.post<any>("/v1/user/alerts", payload);
      setAlerts((prev) => [res.alert, ...prev]);
      setShowForm(false);
      setForm({ propertyState: "", propertyLGA: "", propertyType: "", minPrice: "", maxPrice: "", frequency: "daily" });
      toast.success("Alert created! You'll be notified of matching listings.");
    } catch (err: any) {
      toast.error(err.message || "Failed to create alert");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.post(`/v1/user/alerts/${id}`, {});
      // Use DELETE method via fetch directly
      const token = localStorage.getItem("BT_TOKEN");
      await fetch(`/api/bt/v1/user/alerts/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setAlerts((prev) => prev.filter((a) => a._id !== id));
      toast.success("Alert removed");
    } catch {
      toast.error("Failed to remove alert");
    } finally {
      setDeletingId(null);
    }
  };

  const FREQ_LABELS = {
    instant: "Instant (max 1/hr)",
    daily: "Daily digest",
    weekly: "Weekly digest",
  };

  return (
    <div className="min-h-screen bg-bt-surface">
      <div className="max-w-xl mx-auto px-5 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-[-0.02em]">Listing Alerts</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Get notified when new matching properties go live</p>
          </div>
          {alerts.length < 5 && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-10 h-10 rounded-full bg-bt-primary text-white flex items-center justify-center shadow-[0_2px_8px_rgba(10,8,118,0.25)] active:scale-95 transition-transform"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Push toggle */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden mb-5">
          <PushToggle />
        </div>

        {/* Create form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-5"
            >
              <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-4">
                <h2 className="font-bold text-neutral-900">New Alert</h2>

                {/* State */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">State <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                    <select
                      value={form.propertyState}
                      onChange={(e) => setForm({ ...form, propertyState: e.target.value, propertyLGA: "" })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 text-[16px] bg-white focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary appearance-none"
                    >
                      <option value="">All States</option>
                      {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  </div>
                </div>

                {/* Property type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Property Type</label>
                  <div className="relative">
                    <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                    <select
                      value={form.propertyType}
                      onChange={(e) => setForm({ ...form, propertyType: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 text-[16px] bg-white focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary appearance-none"
                    >
                      <option value="">Any Type</option>
                      {APARTMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  </div>
                </div>

                {/* Price range */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Min Price (₦)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.minPrice}
                        onChange={(e) => setForm({ ...form, minPrice: e.target.value.replace(/[^\d]/g, "") })}
                        placeholder="0"
                        className="w-full pl-10 pr-3 py-3 rounded-xl border border-neutral-200 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Max Price (₦)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.maxPrice}
                        onChange={(e) => setForm({ ...form, maxPrice: e.target.value.replace(/[^\d]/g, "") })}
                        placeholder="Any"
                        className="w-full pl-10 pr-3 py-3 rounded-xl border border-neutral-200 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Frequency */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Alert Frequency</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["instant", "daily", "weekly"] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setForm({ ...form, frequency: f })}
                        className={cn(
                          "py-2.5 rounded-xl text-xs font-semibold border transition-all capitalize",
                          form.frequency === f
                            ? "bg-bt-primary text-white border-bt-primary"
                            : "bg-neutral-50 text-neutral-600 border-neutral-200"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    {form.frequency === "instant" && "Notified within 1 hour of a match. Max 1 per hour."}
                    {form.frequency === "daily" && "One daily summary. Max 1 notification per day."}
                    {form.frequency === "weekly" && "One weekly summary. Max 1 notification per week."}
                  </p>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-full border border-neutral-200 text-neutral-700 font-medium text-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-full bg-bt-primary text-white font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? "Saving…" : "Create Alert"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alert list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-bt-primary" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-100 p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <BellOff className="w-6 h-6 text-neutral-300" />
            </div>
            <p className="font-semibold text-neutral-900 mb-1">No alerts yet</p>
            <p className="text-sm text-neutral-500 mb-5">Create an alert and we'll notify you when matching listings go live.</p>
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-bt-primary text-white text-sm font-semibold">
              <Plus className="w-4 h-4" /> Create Alert
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, i) => {
              const f = alert.filters;
              const chips = [
                f.propertyState,
                f.propertyLGA,
                f.propertyType?.replace(/-/g, " "),
                f.maxPrice ? `Up to ₦${Number(f.maxPrice).toLocaleString()}` : null,
              ].filter(Boolean);

              return (
                <motion.div
                  key={alert._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-neutral-100 p-4 flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-bt-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="w-4 h-4 text-bt-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {chips.map((c, ci) => (
                        <span key={ci} className="px-2 py-0.5 rounded-full bg-bt-primary/6 text-bt-primary text-[11px] font-medium capitalize">
                          {c}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-400 capitalize">{FREQ_LABELS[alert.frequency]}</span>
                      {alert.lastNotifiedAt && (
                        <span className="text-[11px] text-neutral-300">
                          · Last notified {new Date(alert.lastNotifiedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(alert._id)}
                    disabled={deletingId === alert._id}
                    className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors shrink-0"
                  >
                    {deletingId === alert._id
                      ? <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                      : <Trash2 className="w-4 h-4 text-neutral-400 hover:text-red-500" />
                    }
                  </button>
                </motion.div>
              );
            })}

            {alerts.length >= 5 && (
              <p className="text-center text-xs text-neutral-400 py-2">Maximum 5 alerts reached. Delete one to add another.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AlertsPage() {
  return <AuthGuard><AlertsContent /></AuthGuard>;
}
