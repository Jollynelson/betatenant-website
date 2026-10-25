"use client";

import React, { useState } from "react";
import { X, Share2, Copy, Check, MessageCircle, ExternalLink, Sparkles } from "lucide-react";
import { AreaGistData } from "./types";

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AreaGistData;
}

export function WhatsAppShareModal({
  isOpen,
  onClose,
  data,
}: WhatsAppShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const pageUrl = typeof window !== "undefined"
    ? `${window.location.origin}/area-gist?location=${encodeURIComponent(data.locationName)}&state=${encodeURIComponent(data.state)}`
    : `https://betatenant.com/area-gist?location=${encodeURIComponent(data.locationName)}&state=${encodeURIComponent(data.state)}`;

  const formatCurrency = (val: number) => {
    if (!val) return "₦1.5M - ₦3M";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Build high-impact WhatsApp message
  const shareText = [
    `📍 *Area Gist: ${data.locationName}, ${data.state}*`,
    `"${data.headline}"`,
    ``,
    `💰 *Median Rent:* ${formatCurrency(data.stats.medianRent)}/yr`,
    `🏠 *Available Homes:* ${data.stats.totalAvailableListings} verified on Beta Tenant`,
    data.weather ? `⛅ *Live Weather:* ${Math.round(data.weather.temperature)}°C ${data.weather.rain_alert ? "(⚠️ Flood Alert Active!)" : ""}` : "",
    ``,
    `🔍 *Key Reality Check:*`,
    ...data.rentalReality.slice(0, 3).map((r) => `• *${r.dimension}:* ${r.findings.slice(0, 100)}...`),
    ``,
    `Read full neighbourhood intelligence & check before paying caution fee:`,
    `👉 ${pageUrl}`,
  ].filter(Boolean).join("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, "_blank");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Area Gist: ${data.locationName}`,
          text: shareText,
          url: pageUrl,
        });
      } catch {}
    } else {
      handleOpenWhatsApp();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-gray-950">
                Share {data.locationName} Gist
              </h3>
              <p className="text-xs text-gray-500">
                Send this intelligence to friends, family, or roomies on WhatsApp.
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

        {/* WhatsApp Preview Card */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            WhatsApp Message Preview:
          </div>

          <div className="bg-[#E7F8E8] text-gray-900 rounded-2xl p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap border border-emerald-200/60 max-h-56 overflow-y-auto">
            {shareText}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send directly on WhatsApp</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copied to Clipboard!" : "Copy Text"}</span>
              </button>

              {typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-bt-primary bg-bt-primary/5 hover:bg-bt-primary/10 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>More Apps</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
