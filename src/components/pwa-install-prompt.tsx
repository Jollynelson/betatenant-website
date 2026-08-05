"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "BT_INSTALL_DISMISSED";
const DISMISS_DAYS = 14;

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | null>(null);

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((navigator as any).standalone === true) return;

    // Dismissed recently
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - Number(dismissed) < DISMISS_DAYS * 86400_000) return;

    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua) && !(ua.includes("crios") || ua.includes("fxios"));

    if (isIOS) {
      setPlatform("ios");
      setTimeout(() => setShow(true), 5000);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPlatform("android");
      setTimeout(() => setShow(true), 4000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShow(false);
    if (outcome === "dismissed") localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  if (!show || !platform) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 380 }}
        className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] left-3 right-3 z-[60] lg:left-auto lg:right-6 lg:max-w-sm"
      >
        <div className="bg-[#0A0876] rounded-2xl shadow-[0_8px_40px_rgba(10,8,118,0.45)] overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#FB6514] via-[#ff8c47] to-[#FB6514]" />
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-md">
                <Image src="/images/bt_logo.svg" alt="Beta Tenant" width={28} height={28} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-snug">
                  {platform === "ios" ? "Add to Home Screen" : "Install Beta Tenant"}
                </p>
                <p className="text-white/60 text-xs mt-0.5 leading-relaxed">
                  {platform === "ios"
                    ? "Get the full app — faster, offline-ready, no App Store needed."
                    : "Install for faster access, offline browsing, and push alerts."}
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 active:bg-white/20 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5 text-white/60" />
              </button>
            </div>

            {platform === "android" && deferredPrompt && (
              <button
                onClick={handleInstall}
                className="w-full mt-3 py-3 rounded-xl bg-white text-[#0A0876] font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
              >
                <Plus className="w-4 h-4" />
                Install App — Free
              </button>
            )}

            {platform === "ios" && (
              <div className="mt-3 bg-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                <Share className="w-4 h-4 text-white/70 shrink-0" />
                <p className="text-white/75 text-xs leading-relaxed">
                  Tap <span className="font-semibold text-white">Share</span> in Safari, then{" "}
                  <span className="font-semibold text-white">Add to Home Screen</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
