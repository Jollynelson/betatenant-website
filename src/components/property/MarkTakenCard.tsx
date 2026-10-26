"use client";

import React, { useState, useEffect } from "react";
import { 
  AlertOctagon, 
  Clock, 
  CheckCircle2, 
  Archive, 
  Loader2, 
  X, 
  HelpCircle,
  ShieldAlert,
  Send
} from "lucide-react";
import toast from "react-hot-toast";
import { propertyApi } from "@/lib/api";

interface TakenReport {
  status: "none" | "pending_confirmation" | "confirmed_available" | "marked_draft" | string;
  reportedAt?: string | null;
  expiresAt?: string | null;
  reason?: string | null;
  details?: string | null;
}

interface MarkTakenCardProps {
  propertyId: string;
  propertyTitle: string;
  hostName: string;
  isOwner: boolean;
  propertyStatus?: string;
  takenReport?: TakenReport | null;
  onStatusUpdated?: (newStatus: string, newTakenReport: any) => void;
}

const REPORT_REASONS = [
  "Agent / Landlord told me it has been rented out",
  "I visited the property and someone is currently living there",
  "Agent said the listing is off the market / unavailable",
  "Contact phone number said property is no longer vacant",
  "Other reason",
];

export function MarkTakenCard({
  propertyId,
  propertyTitle,
  hostName,
  isOwner,
  propertyStatus = "available",
  takenReport: initialReport,
  onStatusUpdated,
}: MarkTakenCardProps) {
  const [report, setReport] = useState<TakenReport | null>(initialReport ?? null);
  const [currentStatus, setCurrentStatus] = useState(propertyStatus);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Sync props
  useEffect(() => {
    setReport(initialReport ?? null);
  }, [initialReport]);

  useEffect(() => {
    setCurrentStatus(propertyStatus);
  }, [propertyStatus]);

  // Compute countdown timer for 5-hour window
  useEffect(() => {
    if (report?.status !== "pending_confirmation" || !report?.expiresAt) {
      setTimeLeft("");
      return;
    }

    const updateCountdown = () => {
      const exp = new Date(report.expiresAt!).getTime();
      const now = Date.now();
      const diff = exp - now;

      if (diff <= 0) {
        setTimeLeft("Window expired (moving to draft)");
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${mins}m remaining`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [report]);

  // Handle prospective tenant marking taken
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await propertyApi.markTaken(propertyId, selectedReason, details);
      if (res.success) {
        toast.success(
          res.alreadyPending
            ? "This listing is already in the 5-hour verification window."
            : "Report submitted! The host was notified to confirm within 5 hours."
        );
        if (res.takenReport) {
          setReport(res.takenReport);
          if (onStatusUpdated) onStatusUpdated(res.propertyStatus || currentStatus, res.takenReport);
        }
        setIsModalOpen(false);
      } else {
        toast.error(res.message || "Failed to report listing.");
      }
    } catch (err: any) {
      toast.error(err.message || "Error submitting report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle owner confirming still available or moving to draft
  const handleOwnerAction = async (action: "confirm_available" | "mark_draft") => {
    setIsSubmitting(true);
    try {
      const res = await propertyApi.confirmAvailability(propertyId, action);
      if (res.success) {
        toast.success(res.message);
        setReport(res.takenReport);
        setCurrentStatus(res.propertyStatus);
        if (onStatusUpdated) onStatusUpdated(res.propertyStatus, res.takenReport);
      } else {
        toast.error(res.message || "Action failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Error updating listing availability");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPending = report?.status === "pending_confirmation";
  const isDraft = currentStatus === "draft" || report?.status === "marked_draft";

  // If already draft, show simple state
  if (isDraft) {
    return (
      <div className="p-4 rounded-2xl bg-neutral-100 border border-neutral-200/80 flex items-center gap-3 text-neutral-600">
        <Archive className="w-5 h-5 text-neutral-400 shrink-0" />
        <div className="text-xs">
          <p className="font-bold text-neutral-800">Listing Currently in Draft</p>
          <p className="text-neutral-500 mt-0.5">This property is no longer active on public search.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── CARD CONTAINER (Placed right under Contact Card) ── */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isPending 
          ? "bg-amber-50/70 border-amber-200/90 shadow-xs" 
          : "bg-white border-neutral-200 shadow-xs hover:border-neutral-300"
      }`}>
        
        {/* CASE 1: OWNER VIEWING WITH PENDING VERIFICATION */}
        {isOwner && isPending && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-amber-200/60">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-amber-600 animate-bounce" />
                <span>Action Required: Reported Taken</span>
              </div>
              {timeLeft && (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {timeLeft}
                </span>
              )}
            </div>

            <p className="text-xs text-amber-950 font-medium leading-relaxed">
              A prospective tenant reported this property as taken or unavailable. Please verify availability within <strong>5 hours</strong>, otherwise this listing will automatically be moved to <strong>Draft</strong>.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleOwnerAction("confirm_available")}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Still Available</span>
              </button>

              <button
                type="button"
                onClick={() => handleOwnerAction("mark_draft")}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Archive className="w-3.5 h-3.5 text-neutral-500" />
                <span>Move to Draft</span>
              </button>
            </div>
          </div>
        )}

        {/* CASE 2: PROSPECTIVE TENANT VIEWING WITH PENDING VERIFICATION */}
        {!isOwner && isPending && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                Availability Check Active
              </span>
              {timeLeft && (
                <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  {timeLeft}
                </span>
              )}
            </div>
            <p className="text-xs text-amber-950/90 leading-relaxed font-normal">
              A renter recently reported that this home is taken. The host has been notified to re-verify availability within <strong>5 hours</strong>. If they do not respond, the listing will be moved to draft automatically.
            </p>
          </div>
        )}

        {/* CASE 3: STANDARD STATE (NO PENDING REPORT) */}
        {!isPending && (
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 shrink-0 mt-0.5">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900 leading-tight">
                  {isOwner ? "Has this property been rented?" : "Is this listing no longer available?"}
                </h4>
                <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5 leading-snug font-normal">
                  {isOwner 
                    ? "If this home has been taken, you can mark it as draft so tenants stop calling."
                    : "If you contacted the agent or visited and found out it's taken, let us know."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (isOwner) {
                  if (confirm("Move this listing to draft? You can re-activate it anytime from your account.")) {
                    handleOwnerAction("mark_draft");
                  }
                } else {
                  setIsModalOpen(true);
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/80 text-rose-800 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
              <span>{isOwner ? "Mark Listing as Taken" : "Mark Listing as Not Available or Taken"}</span>
            </button>
          </div>
        )}

      </div>

      {/* ── MODAL: REPORT PROPERTY AS TAKEN ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-950">
                    Mark Listing as Taken
                  </h3>
                  <p className="text-xs text-gray-500">
                    Help keep Beta Tenant accurate for fellow renters.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitReport} className="p-5 space-y-4 overflow-y-auto">
              
              {/* Notice Banner */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-950 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  What happens next?
                </div>
                <p className="leading-relaxed">
                  The host (<strong>{hostName}</strong>) will receive an urgent notification to confirm within <strong>5 hours</strong>. If they don't confirm it's still available, this listing is automatically moved to draft.
                </p>
              </div>

              {/* Reason Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  What happened when you inquired?
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((reason, idx) => (
                    <label
                      key={idx}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                        selectedReason === reason
                          ? "border-bt-primary bg-bt-primary/5 text-gray-950 shadow-xs"
                          : "border-gray-200 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="taken_reason"
                        value={reason}
                        checked={selectedReason === reason}
                        onChange={() => setSelectedReason(reason)}
                        className="mt-0.5 text-bt-primary focus:ring-bt-primary"
                      />
                      <span className="leading-snug">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Details (Optional) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={2}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="e.g. Agent said deposit was paid this morning..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-bt-primary"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit & Notify Lister</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
    </>
  );
}
