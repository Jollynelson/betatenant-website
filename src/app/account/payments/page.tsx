"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Receipt, ChevronRight, CreditCard, Loader2,
  Crown, Zap, Unlock, Home, ShoppingBag, RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { AuthGuard } from "@/components/auth-guard";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Transaction {
  reference: string;
  amount: number;
  currency: string;
  date: string;
  type: string;
  label: string;
  status: string;
  plan?: string;
  meta?: any;
  channel?: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<any>; color: string; bg: string }> = {
  subscription:     { icon: Crown,       color: "text-amber-600",   bg: "bg-amber-50" },
  boost_credits:    { icon: Zap,         color: "text-bt-primary",  bg: "bg-bt-primary/8" },
  contact_unlock:   { icon: Unlock,      color: "text-emerald-600", bg: "bg-emerald-50" },
  rent_payment:     { icon: Home,        color: "text-bt-secondary",bg: "bg-bt-secondary/10" },
  shortlet_payment: { icon: Home,        color: "text-bt-secondary",bg: "bg-bt-secondary/10" },
  other:            { icon: ShoppingBag, color: "text-neutral-500",  bg: "bg-neutral-100" },
};

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function generateReceiptHTML(t: Transaction): string {
  const date = new Date(t.date).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt — Beta Tenant</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111;padding:40px}.logo{font-size:22px;font-weight:800;color:#0A0876;margin-bottom:48px}h1{font-size:32px;font-weight:700;margin-bottom:32px}.meta{display:flex;justify-content:space-between;margin-bottom:32px}.label{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:4px}.value{font-size:14px;font-weight:500}.card{background:#f4f4f4;border-radius:12px;padding:20px 24px;margin-bottom:16px}.row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e5e5e5}.row:last-child{border-bottom:none}.total{font-weight:700;font-size:16px}.footer{margin-top:32px;font-size:12px;color:#888}</style></head><body>
<div class="logo">🏠 Beta Tenant</div><h1>Receipt</h1>
<div class="meta"><div><div class="label">Invoice ID</div><div class="value">${esc(t.reference)}</div></div><div style="text-align:right"><div class="label">Date</div><div class="value">${date}</div></div></div>
<div class="card"><div class="row"><span style="font-weight:600">${esc(t.label)}</span><span></span></div>
<div class="row"><span>${esc(t.label)}${t.plan ? ` (${esc(t.plan)})` : ""}</span><span>₦${t.amount.toLocaleString()}</span></div>
<div class="row total"><span>Total</span><span>₦${t.amount.toLocaleString()}</span></div></div>
<p class="footer">Questions? Contact support@betatenant.com</p></body></html>`;
}

function openReceipt(t: Transaction) {
  const win = window.open("", "_blank");
  if (win) { win.document.write(generateReceiptHTML(t)); win.document.close(); setTimeout(() => win.print(), 400); }
}

function PaymentsContent() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [syncing, setSyncing]           = useState(false);
  const [expanded, setExpanded]         = useState<number | null>(0);
  const [filter, setFilter]             = useState("all");

  const loadAll = () => {
    setLoading(true);
    api.get<any>("/v1/user/all-transactions")
      .then(r => setTransactions(r.transactions ?? []))
      .catch(() => toast.error("Failed to load transactions"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Sync subscription history first, then load all
    setSyncing(true);
    api.post<any>("/v1/user/subscription/sync", {})
      .catch(() => {})
      .finally(() => { setSyncing(false); loadAll(); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const FILTERS = [
    { key: "all",           label: "All" },
    { key: "subscription",  label: "Subscriptions" },
    { key: "boost_credits", label: "Boost Credits" },
    { key: "contact_unlock",label: "Unlocks" },
    { key: "other",         label: "Other" },
  ];

  const filtered = filter === "all"
    ? transactions
    : transactions.filter(t => {
        if (filter === "other") return !["subscription", "boost_credits", "contact_unlock"].includes(t.type);
        return t.type === filter;
      });

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-neutral-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors">
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </button>
          <h1 className="text-base font-bold text-neutral-900 flex-1">Transaction History</h1>
          {syncing && <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />}
          <button onClick={loadAll} className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4 text-neutral-600" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">
        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5 pb-1">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={cn(
                "shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all",
                filter === f.key
                  ? "bg-bt-primary text-white border-bt-primary"
                  : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
              )}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-bt-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center">
            <Receipt className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-neutral-900 mb-1">
              {filter === "all" ? "No transactions yet" : `No ${FILTERS.find(f => f.key === filter)?.label.toLowerCase()} yet`}
            </p>
            <p className="text-xs text-neutral-400">Your payment history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Summary */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400">Total paid</p>
                <p className="text-lg font-bold text-neutral-900">
                  ₦{filtered.reduce((s, t) => s + t.amount, 0).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-400">{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</p>
                <p className="text-xs text-emerald-600 font-semibold">{filtered.filter(t => t.status === "success").length} successful</p>
              </div>
            </div>

            {filtered.map((t, i) => {
              const cfg = TYPE_CONFIG[t.type] ?? TYPE_CONFIG.other;
              const Icon = cfg.icon;
              const isOpen = expanded === i;

              return (
                <div key={t.reference || i} className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
                  <button onClick={() => setExpanded(isOpen ? null : i)}
                    className="w-full flex items-center gap-3.5 px-4 py-4 text-left hover:bg-neutral-50 transition-colors">
                    {/* Icon */}
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", cfg.bg)}>
                      <Icon className={cn("w-5 h-5", cfg.color)} />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-900">{t.label}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {new Date(t.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                        {t.plan && <span className="ml-1 capitalize">· {t.plan}</span>}
                      </p>
                    </div>
                    {/* Amount + chevron */}
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
                        <p className="text-sm font-bold text-neutral-900">₦{t.amount.toLocaleString()}</p>
                        <p className="text-[10px] font-semibold text-emerald-600 text-right">✓ Paid</p>
                      </div>
                      <ChevronRight className={cn("w-4 h-4 text-neutral-300 transition-transform", isOpen && "rotate-90")} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-neutral-100 px-4 pb-4 pt-3 space-y-3">
                      {/* Reference */}
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide">Reference</p>
                        <button
                          onClick={() => { navigator.clipboard.writeText(t.reference).catch(() => {}); toast.success("Copied!"); }}
                          className="flex items-center gap-1.5 text-xs text-neutral-600 font-mono bg-neutral-50 px-2.5 py-1.5 rounded-lg border border-neutral-100 hover:border-neutral-200 transition-colors max-w-[200px]">
                          <span className="truncate">{t.reference}</span>
                          <CreditCard className="w-3 h-3 opacity-40 shrink-0" />
                        </button>
                      </div>

                      {/* Details */}
                      <div className="rounded-xl border border-neutral-100 overflow-hidden">
                        <div className="grid grid-cols-3 px-4 py-2 bg-neutral-50 border-b border-neutral-100 text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">
                          <span>Item</span><span className="text-right">Amount</span><span className="text-right">Status</span>
                        </div>
                        <div className="grid grid-cols-3 items-center px-4 py-3">
                          <p className="text-sm font-semibold text-neutral-900 pr-2">{t.label}{t.plan ? ` (${t.plan})` : ""}</p>
                          <p className="text-sm text-neutral-700 text-right">₦{t.amount.toLocaleString()}</p>
                          <div className="flex justify-end">
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Paid
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Property context for unlock transactions */}
                      {t.type === "contact_unlock" && (t as any).propertyTitle && (
                        <div className="flex items-start gap-2 p-2.5 bg-neutral-50 rounded-xl border border-neutral-100">
                          <Unlock className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-neutral-800">{(t as any).propertyTitle}</p>
                            {(t as any).propertyLocation && (
                              <p className="text-[11px] text-neutral-400">{(t as any).propertyLocation}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {t.channel && (
                        <p className="text-xs text-neutral-400">via {t.channel.replace(/_/g, " ")}</p>
                      )}

                      <button onClick={() => openReceipt(t)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
                        <Receipt className="w-4 h-4" /> Download Receipt
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  return <AuthGuard><PaymentsContent /></AuthGuard>;
}
