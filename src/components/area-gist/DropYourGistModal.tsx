"use client";

import React, { useState } from "react";
import { X, Send, Sparkles, MessageSquarePlus, ShieldCheck, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface DropYourGistModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationName: string;
  state: string;
  onReportSubmitted?: () => void;
}

const CATEGORIES = [
  "Electricity & Power",
  "Water Access & Quality",
  "Drainage & Flooding",
  "Security & Safety",
  "Traffic & Commute",
  "Landlord & Agent Realities",
  "General Quality of Life",
];

const OCCURRENCE_TYPES = [
  "Happens Daily / Constant",
  "Seasonal (Rainy Season)",
  "Occasional / Sporadic",
  "Permanent Feature",
];

export function DropYourGistModal({
  isOpen,
  onClose,
  locationName,
  state,
  onReportSubmitted,
}: DropYourGistModalProps) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [streetOrLandmark, setStreetOrLandmark] = useState("");
  const [gist, setGist] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [occurrenceType, setOccurrenceType] = useState(OCCURRENCE_TYPES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gist.trim() || !streetOrLandmark.trim()) {
      setErrorMsg("Please provide your street or landmark and the details of your gist.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE_URL}/v1/area-gist/community`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationName,
          state,
          category,
          streetOrLandmark,
          gist,
          authorName: authorName.trim() || "Anonymous Resident",
          occurrenceType,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
          if (onReportSubmitted) onReportSubmitted();
        }, 1800);
      } else {
        setErrorMsg(data.message || "Failed to submit gist. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg("Network error. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-bt-primary/10 text-bt-primary">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-gray-950">
                Drop Your Gist: {locationName}
              </h3>
              <p className="text-xs text-gray-500">
                Help future tenants avoid bad surprises. Keep it honest and factual.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Form */}
        {success ? (
          <div className="p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-gray-950 mb-1">
              Gist Dropped Successfully!
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 max-w-xs mx-auto">
              Thank you for keeping renters informed. Your report will appear on the neighbourhood board.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                What is this gist about?
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-bt-primary"
              >
                {CATEGORIES.map((cat, i) => (
                  <option key={i} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Street / Landmark */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Specific Street or Landmark in {locationName} *
              </label>
              <input
                type="text"
                value={streetOrLandmark}
                onChange={(e) => setStreetOrLandmark(e.target.value)}
                placeholder="e.g. Commercial Avenue, near Sabo Market, or St. Finbarrs"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-bt-primary"
              />
            </div>

            {/* The Gist */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                The Honest Reality *
              </label>
              <textarea
                value={gist}
                onChange={(e) => setGist(e.target.value)}
                rows={3}
                placeholder="What should a tenant know before paying? e.g., 'Light is steady at 16 hrs daily on Band B, but the street floods knee-deep after 30 mins of heavy rain...'"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-bt-primary"
              />
            </div>

            {/* Frequency & Name Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Frequency / Pattern
                </label>
                <select
                  value={occurrenceType}
                  onChange={(e) => setOccurrenceType(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-bt-primary"
                >
                  {OCCURRENCE_TYPES.map((t, i) => (
                    <option key={i} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Your Name or Handle (Optional)
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Resident of 2 yrs"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-bt-primary"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-bt-primary hover:bg-bt-primary-light shadow-md disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Drop My Gist
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
