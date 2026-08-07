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

// Safari share icon — exactly matches what appears in the browser
function ShareIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline", verticalAlign: "middle", flexShrink: 0 }}
    >
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
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
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 380 }}
        className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+0.5rem)] left-3 right-3 z-[60] lg:left-auto lg:right-6 lg:max-w-[360px]"
      >
        {platform === "android" && (
          /* Android: clean one-row pill — icon, text, install button */
          <div className="flex items-center gap-3 bg-neutral-900/95 backdrop-blur-md rounded-2xl px-4 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
              <Image src="/images/bt_logo.png" alt="Beta Tenant" width={26} height={26} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-none">Install Beta Tenant</p>
              <p className="text-white/50 text-xs mt-1">Add to home screen</p>
            </div>
            <button
              onClick={handleDismiss}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5 text-white/50" />
            </button>
            <button
              onClick={handleInstall}
              disabled={installing}
              className="px-4 py-2 rounded-xl bg-[#0A0876] text-white font-bold text-sm shrink-0 active:scale-95 transition-transform disabled:opacity-60"
            >
              {installing ? "…" : "Install"}
            </button>
          </div>
        )}

        {platform === "ios" && (
          /* iOS: same compact pill, instruction inline with actual Share icon */
          <div className="flex items-center gap-3 bg-neutral-900/95 backdrop-blur-md rounded-2xl px-4 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
              <Image src="/images/bt_logo.png" alt="Beta Tenant" width={26} height={26} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-snug">
                Install Beta Tenant
              </p>
              <p className="text-white/55 text-xs mt-0.5 flex items-center gap-1 flex-wrap leading-snug">
                Tap <ShareIcon size={13} />{" "}
                <span className="font-semibold text-white/80">Share</span>, then
                {" "}"Add to Home Screen"
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5 text-white/50" />
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
