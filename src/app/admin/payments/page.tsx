"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Receipt, Copy, Download, ChevronDown, ChevronUp,
  Check, X, Loader2, ArrowLeft, Crown, User, Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api";

const ADMIN_API = `${API_BASE_URL}/v1/admin`;

function getAdminToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("BT_ADMIN_TOKEN");
}

async function adminGet(path: string) {
  const token = getAdminToken();
  const res = await fetch(`${ADMIN_API}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

interface Payment {
  _id: string;
  userId: string;
  phoneNumber: string;
  reference: string;
  amount: number;
  status: string;
  plan?: string;
  createdAt: string;
  completedAt?: string;
  metadata?: { subscriptionTier?: string; subscriptionMonths?: number };
  user?: {
    firstName?: string; lastName?: string; email?: string; phoneNumber?: string;
    userSubscriptionObject?: { status?: string; expiresAt?: string; plan?: string };
  };
}

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function generateReceiptHTML(p: Payment): string {
  const date = new Date(p.completedAt ?? p.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
  const plan = p.metadata?.subscriptionTier ?? "monthly";
  const planLabel = `Premium ${plan === "yearly" ? "Annual" : "Monthly"} (${plan === "yearly" ? "1 year" : "1 month"})`;
  const vatRate = 0.075;
  const amountExVat = Math.round(p.amount / (1 + vatRate));
  const vatAmount = p.amount - amountExVat;
  const userName = p.user ? `${p.user.firstName ?? ""} ${p.user.lastName ?? ""}`.trim() : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt — Beta Tenant</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; background: #fff; padding: 40px; }
    .logo { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #0A0876; margin-bottom: 48px; }
    h1 { font-size: 32px; font-weight: 700; margin-bottom: 32px; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 32px; }
    .meta-block p:first-child { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 4px; }
    .meta-block p:last-child { font-size: 14px; font-weight: 500; }
    .card { background: #f4f4f4; border-radius: 12px; padding: 20px 24px; margin-bottom: 16px; }
    .row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e5e5e5; }
    .row:last-child { border-bottom: none; }
    .row.total { font-weight: 700; font-size: 16px; }
    .row.total .amount { font-size: 20px; }
    .sub-card { background: #e8e8e8; border-radius: 8px; padding: 14px 16px; margin-top: 12px; }
    .sub-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: #555; }
    .footer { margin-top: 32px; font-size: 12px; color: #888; }
    .footer a { color: #0A0876; }
  </style>
</head>
<body>
  <div class="logo">🏠 Beta Tenant</div>
  <h1>Receipt</h1>
  <div class="meta">
    <div class="meta-block">
      <p>INVOICE ID</p>
      <p>${esc(p.reference)}</p>
    </div>
    <div class="meta-block" style="text-align:right">
      <p>DATE</p>
      <p>${date}</p>
    </div>
  </div>
  ${userName ? `<div style="margin-bottom:24px"><p style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:4px">BILLED TO</p><p style="font-size:14px;font-weight:500">${esc(userName)}</p><p style="font-size:12px;color:#666">${esc(p.user?.email ?? "")}</p></div>` : ""}
  <div class="card">
    <div class="row"><span style="font-weight:600">Items</span><span></span></div>
    <div class="row"><span>${planLabel}</span><span>₦${p.amount.toLocaleString()}</span></div>
    <div class="row total"><span>Total</span><span class="amount">₦${p.amount.toLocaleString()}</span></div>
    <div class="sub-card">
      <div class="sub-row"><span>VAT (7.5% × ₦${amountExVat.toLocaleString()})</span><span>₦${vatAmount.toLocaleString()}</span></div>
      <div class="sub-row" style="margin-top:8px"><span style="font-weight:600">Payment method</span></div>
      <div class="sub-row"><span>Paystack</span></div>
    </div>
  </div>
  <p class="footer">Questions? Contact us at support@betatenant.com · <a href="https://betatenant.com/terms">Terms &amp; Conditions</a> apply.</p>
</body>
</html>`;
}

function downloadReceipt(p: Payment) {
  const html = generateReceiptHTML(p);
  const blob = new Blob([html], { type: "text/html" });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, "_blank");
  if (win) {
    win.onload = () => { win.print(); setTimeout(() => URL.revokeObjectURL(url), 2000); };
  } else {
    const a = document.createElement("a");
    a.href = url; a.download = `receipt-${p.reference.slice(-8)}.html`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

export default function AdminPaymentsPage() {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<Payment[]>([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await adminGet(`/subscription-payments?q=${encodeURIComponent(q)}&limit=50`);
      setResults(res.docs ?? []);
    } catch (err: any) {
      toast.error(err.message || "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all on mount, debounce on query change
  useEffect(() => { search(""); }, [search]);

  useEffect(() => {
    if (!searched) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/admin/push"
            className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors">
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </Link>
          <h1 className="text-base font-bold text-neutral-900 flex-1">Subscription Payments</h1>
          {!loading && searched && (
            <span className="text-xs text-neutral-400">{results.length} result{results.length !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-4">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by invoice ID, reference, user ID or phone..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-neutral-200 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all shadow-sm"
          />
          {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 animate-spin" />}
        </div>

        {/* Results */}
        {results.length === 0 && searched && !loading ? (
          <div className="bg-white rounded-2xl border border-neutral-100 p-10 text-center">
            <Receipt className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">No subscription payments found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((p) => {
              const isOpen = expanded === p._id;
              const statusStyle = p.status === "success"
                ? "bg-emerald-50 text-emerald-700"
                : p.status === "failed" ? "bg-red-50 text-red-700"
                : "bg-neutral-100 text-neutral-500";
              const userName = p.user ? `${p.user.firstName ?? ""} ${p.user.lastName ?? ""}`.trim() : "";
              const plan = p.metadata?.subscriptionTier ?? "monthly";

              return (
                <div key={p._id} className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
                  {/* Summary row */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : p._id)}
                    className="w-full flex items-start justify-between px-5 py-4 text-left hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                        <Crown className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-neutral-900">
                            {new Date(p.completedAt ?? p.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-bold", statusStyle)}>
                            {p.status === "success" ? "Paid" : p.status}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-bt-primary/8 text-bt-primary text-[11px] font-semibold capitalize">
                            {plan}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {userName && <span className="mr-2">{userName}</span>}
                          <span className="font-mono text-[11px]">{p.reference.slice(-12)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-sm font-bold text-neutral-900">₦{p.amount.toLocaleString()}</p>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="border-t border-neutral-100 px-5 pb-5 pt-4 space-y-4">

                      {/* User info */}
                      {p.user && (
                        <div className="bg-neutral-50 rounded-xl p-4 space-y-1.5">
                          <p className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-2">User</p>
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <p className="text-sm font-semibold text-neutral-900">{userName || "—"}</p>
                            {p.user.userSubscriptionObject?.status === "active" && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">Premium Active</span>
                            )}
                          </div>
                          {p.user.email && <p className="text-xs text-neutral-500 ml-5">{p.user.email}</p>}
                          {p.user.phoneNumber && <p className="text-xs text-neutral-500 ml-5">{String(p.user.phoneNumber).replace(/^234/, "0")}</p>}
                          {p.user.userSubscriptionObject?.expiresAt && (
                            <p className="text-xs text-neutral-500 ml-5 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Sub expires {new Date(p.user.userSubscriptionObject.expiresAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Transaction detail */}
                      <div className="rounded-xl border border-neutral-100 overflow-hidden">
                        <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100">
                          <p className="text-xs font-bold text-neutral-400 uppercase tracking-wide">Transaction Detail</p>
                        </div>
                        {[
                          ["Invoice ID / Reference", p.reference],
                          ["Plan",                   `Premium ${plan === "yearly" ? "Annual" : "Monthly"}`],
                          ["Amount",                 `₦${p.amount.toLocaleString()}`],
                          ["Status",                 p.status],
                          ["Date",                   new Date(p.completedAt ?? p.createdAt).toLocaleString("en-NG")],
                          ["User ID",                p.userId],
                        ].map(([label, value]) => (
                          <div key={label} className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-50 last:border-0">
                            <p className="text-xs text-neutral-400">{label}</p>
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-neutral-800 font-mono text-right max-w-[200px] truncate">{value}</p>
                              {(label === "Invoice ID / Reference" || label === "User ID") && (
                                <button onClick={() => { navigator.clipboard.writeText(String(value)).catch(() => {}); toast.success("Copied!"); }}
                                  className="text-neutral-300 hover:text-neutral-600 transition-colors">
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <button onClick={() => downloadReceipt(p)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
                        <Download className="w-4 h-4" /> Download Receipt
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
