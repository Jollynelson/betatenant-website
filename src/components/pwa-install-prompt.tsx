"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "BT_INSTALL_DISMISSED";
const DISMISS_DAYS = 14;

// iOS Share icon — matches exactly what's in Safari's toolbar
function IOSShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 1v11M6.5 4.5L10 1l3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 7H3a1 1 0 00-1 1v9a1 1 0 001 1h14a1 1 0 001-1V8a1 1 0 00-1-1h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

// iOS "Add to Home Screen" square-with-plus icon
function IOSAddIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="16" height="16" rx="3.5" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M10 6v8M6 10h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export function PWAInstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (["/onboarding", "/auth"].some((p) => pathname.startsWith(p))) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((navigator as any).standalone === true) return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - Number(dismissed) < DISMISS_DAYS * 86400_000) return;

    // Only show after 3 page visits — user is engaged
    const views = Number(sessionStorage.getItem("BT_PAGE_VIEWS") || 0) + 1;
    sessionStorage.setItem("BT_PAGE_VIEWS", String(views));
    if (views < 3) return;

    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua) && !(ua.includes("crios") || ua.includes("fxios"));

    let timer: ReturnType<typeof setTimeout>;

    if (isIOS) {
      setPlatform("ios");
      timer = setTimeout(() => setShow(true), 5000);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPlatform("android");
      timer = setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [pathname]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShow(false);
      if (outcome === "dismissed") localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  if (!show || !platform) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="install-prompt"
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 360 }}
        className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] left-3 right-3 z-[60] lg:left-auto lg:right-6 lg:max-w-sm"
      >
        <div className="bg-[#0A0876] rounded-2xl shadow-[0_12px_48px_rgba(10,8,118,0.5)] overflow-hidden">
          {/* Orange accent line */}
          <div className="h-[3px] bg-gradient-to-r from-[#FB6514] via-[#ff9a5c] to-[#FB6514]" />

          <div className="p-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[10px] bg-white flex items-center justify-center shrink-0 shadow-md">
                <Image src="/images/bt_logo.svg" alt="Beta Tenant" width={28} height={28} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">Get the Beta Tenant app</p>
                <p className="text-white/55 text-xs mt-0.5">Faster, offline-ready, no App Store needed</p>
              </div>
              <button
                onClick={handleDismiss}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 active:bg-white/20 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5 text-white/50" />
              </button>
            </div>

            {/* Android: single install button */}
            {platform === "android" && (
              <button
                onClick={handleInstall}
                disabled={installing}
                className="w-full mt-3 py-3.5 rounded-xl bg-white text-[#0A0876] font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-70"
              >
                <Plus className="w-4 h-4" />
                {installing ? "Installing…" : "Add to Home Screen"}
              </button>
            )}

            {/* iOS: visual step-by-step guide */}
            {platform === "ios" && (
              <div className="mt-3 space-y-2">
                <p className="text-white/50 text-[11px] uppercase tracking-wider font-semibold px-0.5">2 quick steps in Safari</p>

                {/* Step 1 */}
                <div className="flex items-center gap-3 bg-white/10 rounded-xl px-3.5 py-3">
                  <div className="w-8 h-8 rounded-full bg-[#FB6514] flex items-center justify-center shrink-0 text-white">
                    <IOSShareIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold leading-snug">Tap the Share button</p>
                    <p className="text-white/50 text-xs mt-0.5">Bottom of Safari — the box with an arrow</p>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-white/70">
                    <IOSShareIcon />
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-center gap-3 bg-white/10 rounded-xl px-3.5 py-3">
                  <div className="w-8 h-8 rounded-full bg-[#FB6514] flex items-center justify-center shrink-0 text-white font-bold text-sm">
                    <IOSAddIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold leading-snug">Tap "Add to Home Screen"</p>
                    <p className="text-white/50 text-xs mt-0.5">Scroll down in the share sheet</p>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-white/70">
                    <IOSAddIcon />
                  </div>
                </div>

                {/* Arrow hint pointing down toward Safari toolbar */}
                <p className="text-center text-white/30 text-[11px] pb-0.5">
                  ↓ Share button is at the bottom of your screen
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
