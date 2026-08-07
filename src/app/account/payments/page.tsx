"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Receipt, ChevronRight, Check, CreditCard, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { AuthGuard } from "@/components/auth-guard";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Payment {
  date: string;
  plan: string;
  amount: number;
  reference: string;
  status?: string;
}

function generateReceiptHTML(p: Payment): string {
  const date = new Date(p.date).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
  const planLabel = `Premium ${p.plan === "yearly" ? "Annual" : "Monthly"} (${p.plan === "yearly" ? "1 year" : "1 month"})`;
  const vatRate = 0.075;
  const amountExVat = Math.round(p.amount / (1 + vatRate));
  const vatAmount = p.amount - amountExVat;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt — Beta Tenant</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111;background:#fff;padding:40px}.logo{font-size:22px;font-weight:800;color:#0A0876;margin-bottom:48px}h1{font-size:32px;font-weight:700;margin-bottom:32px}.meta{display:flex;justify-content:space-between;margin-bottom:32px}.meta-block p:first-child{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:4px}.meta-block p:last-child{font-size:14px;font-weight:500}.card{background:#f4f4f4;border-radius:12px;padding:20px 24px;margin-bottom:16px}.row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #e5e5e5}.row:last-child{border-bottom:none}.row.total{font-weight:700;font-size:16px}.row.total .amount{font-size:20px}.sub-card{background:#e8e8e8;border-radius:8px;padding:14px 16px;margin-top:12px}.sub-row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#555}.footer{margin-top:32px;font-size:12px;color:#888}</style></head><body><div class="logo">🏠 Beta Tenant</div><h1>Receipt</h1><div class="meta"><div class="meta-block"><p>INVOICE ID</p><p>${p.reference}</p></div><div class="meta-block" style="text-align:right"><p>DATE</p><p>${date}</p></div></div><div class="card"><div class="row"><span style="font-weight:600">Items</span><span></span></div><div class="row"><span>${planLabel}</span><span>₦${p.amount.toLocaleString()}</span></div><div class="row total"><span>Total</span><span class="amount">₦${p.amount.toLocaleString()}</span></div><div class="sub-card"><div class="sub-row"><span>VAT (7.5% × ₦${amountExVat.toLocaleString()})</span><span>₦${vatAmount.toLocaleString()}</span></div><div class="sub-row" style="margin-top:8px"><span style="font-weight:600">Payment method</span></div><div class="sub-row"><span>Paystack</span></div></div></div><p class="footer">Questions? Contact support@betatenant.com</p></body></html>`;
}

function openReceipt(p: Payment) {
  const win = window.open("", "_blank");
  if (win) { win.document.write(generateReceiptHTML(p)); win.document.close(); setTimeout(() => win.print(), 400); }
}

function PaymentsContent() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<number | null>(0);

  useEffect(() => {
    api.get<any>("/v1/user/subscription/status")
      .then((r) => setPayments(r.paymentHistory ?? []))
      .catch(() => toast.error("Failed to load payment history"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="sticky top-0 z-30 bg-white border-b border-neutral-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors">
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </button>
          <h1 className="text-base font-bold text-neutral-900 flex-1">Payment History</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-bt-primary" />
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center">
            <Receipt className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-neutral-900 mb-1">No payments yet</p>
            <p className="text-xs text-neutral-400">Your subscription payments will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((p, i) => {
              const isOpen = expanded === i;
              return (
                <div key={i} className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
                  <button onClick={() => setExpanded(isOpen ? null : i)}
                    className="w-full flex items-start justify-between px-5 py-4 text-left hover:bg-neutral-50 transition-colors">
                    <div>
                      <p className="text-base font-bold text-neutral-900">
                        {new Date(p.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <p className="text-sm text-neutral-500 mt-0.5">₦{p.amount.toLocaleString()}</p>
                    </div>
                    <ChevronRight className={cn("w-5 h-5 text-neutral-400 mt-0.5 transition-transform shrink-0", isOpen && "rotate-90")} />
                  </button>

                  {isOpen && (
                    <div className="border-t border-neutral-100 px-5 pb-5 pt-4 space-y-4">
                      {/* Invoice ID */}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide">Invoice ID</p>
                        <button onClick={() => { navigator.clipboard.writeText(p.reference).catch(() => {}); toast.success("Copied!"); }}
                          className="flex items-center gap-1.5 text-xs text-neutral-600 font-mono bg-neutral-50 px-2.5 py-1.5 rounded-lg border border-neutral-100 hover:border-neutral-200 transition-colors">
                          <span className="truncate max-w-[160px]">{p.reference}</span>
                          <CreditCard className="w-3 h-3 opacity-40 shrink-0" />
                        </button>
                      </div>

                      {/* Line items */}
                      <div className="rounded-xl border border-neutral-100 overflow-hidden">
                        <div className="grid grid-cols-3 px-4 py-2.5 bg-neutral-50 border-b border-neutral-100 text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">
                          <span>Item</span><span className="text-right">Amount</span><span className="text-right">Status</span>
                        </div>
                        <div className="grid grid-cols-3 items-center px-4 py-3">
                          <p className="text-sm font-semibold text-neutral-900">Premium {p.plan === "yearly" ? "Annual" : "Monthly"}</p>
                          <p className="text-sm text-neutral-700 text-right">₦{p.amount.toLocaleString()}</p>
                          <div className="flex justify-end">
                            {(!p.status || p.status === "success") ? (
                              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Paid
                              </span>
                            ) : (
                              <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize",
                                p.status === "failed" ? "bg-red-50 text-red-600" :
                                p.status === "pending" ? "bg-amber-50 text-amber-700" :
                                "bg-neutral-100 text-neutral-500"
                              )}>
                                {p.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {(!p.status || p.status === "success") && (
                        <button onClick={() => openReceipt(p)}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
                          <Receipt className="w-4 h-4" /> Download Receipt
                        </button>
                      )}
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
