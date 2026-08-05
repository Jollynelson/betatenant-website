"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed recently
    const dismissed = localStorage.getItem("BT_INSTALL_DISMISSED");
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    // iOS detection
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = (navigator as any).standalone === true;
    setIsIOS(ios);

    if (ios && !standalone) {
      // Show iOS instructions after 3s
      setTimeout(() => setShow(true), 3000);
    }

    // Android / Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (prompt) {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") {
        setShow(false);
        localStorage.removeItem("BT_INSTALL_DISMISSED");
      }
      setPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("BT_INSTALL_DISMISSED", String(Date.now()));
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 350 }}
        className="fixed bottom-[72px] left-3 right-3 z-[60] lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="bg-[#0A0876] rounded-2xl p-4 shadow-[0_-4px_30px_rgba(0,0,0,0.25)] overflow-hidden">
          {/* Decorative blob */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />

          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-md">
              <Image src="/images/bt_logo.svg" alt="Beta Tenant" width={32} height={32} className="w-8 h-8" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">Add to Home Screen</p>
              <p className="text-white/60 text-xs mt-0.5 leading-relaxed">
                {isIOS
                  ? 'Tap the Share icon then "Add to Home Screen" for the full app experience.'
                  : "Install Beta Tenant for faster access and offline browsing."}
              </p>
            </div>

            <button
              onClick={handleDismiss}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5 active:bg-white/20"
            >
              <X className="w-3.5 h-3.5 text-white/70" />
            </button>
          </div>

          {!isIOS && prompt && (
            <button
              onClick={handleInstall}
              className="w-full mt-3 py-3 rounded-xl bg-white text-bt-primary font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Download className="w-4 h-4" />
              Install App — It&apos;s Free
            </button>
          )}

          {isIOS && (
            <div className="mt-3 flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5">
              <span className="text-white/70 text-xs">
                Tap <span className="inline-block mx-1 px-2 py-0.5 bg-white/20 rounded text-white font-medium">Share</span>
                then <span className="inline-block ml-1 px-2 py-0.5 bg-white/20 rounded text-white font-medium">Add to Home Screen</span>
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
