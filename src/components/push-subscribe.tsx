"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, X } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

const VAPID_PUBLIC_KEY = "BL3sf9qSiYidsgmd1zBX4Zk2KbmllVtAxi8oh3OhgKcxkndtG0KXQusyyqxfDp-rBonip4QhyUV-wUqePMo0KXE";
const PUSH_DISMISSED_KEY = "BT_PUSH_DISMISSED";
const PUSH_DISMISS_DAYS = 30;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Works for both /v1/user/* and /v1/landlordandagent/* roles
function getPushEndpoint(action: "subscribe" | "unsubscribe") {
  const token = localStorage.getItem("BT_TOKEN");
  const userStr = localStorage.getItem("BT_USER");
  const role = userStr ? JSON.parse(userStr).role : "user";
  const base = (role === "agent" || role === "landlord") ? "/v1/landlordandagent" : "/v1/user";
  return `${base}/push-${action}`;
}

export async function subscribeToPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    toast.error("Push notifications not supported on this browser");
    return false;
  }
  if (!("Notification" in window)) {
    toast.error("Notifications not supported");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "denied") {
      toast.error("Notifications blocked. Enable in your browser settings.");
      return false;
    }
    if (permission !== "granted") return false;

    // Ensure service worker is registered (even in dev for testing)
    let reg: ServiceWorkerRegistration;
    try {
      reg = await navigator.serviceWorker.ready;
    } catch {
      // SW not yet registered — register now
      reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
    }

    // Unsubscribe any stale subscription first
    const existing = await reg.pushManager.getSubscription();
    if (existing) await existing.unsubscribe();

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });

    const subJson = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
    await api.post(getPushEndpoint("subscribe"), { subscription: subJson });
    localStorage.setItem("BT_PUSH_SUBSCRIBED", "1");
    localStorage.removeItem(PUSH_DISMISSED_KEY);
    return true;
  } catch (err: any) {
    console.error("Push subscribe error:", err);
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      // Backend DELETE endpoint expects endpoint in body
      await api.del(getPushEndpoint("unsubscribe"), { endpoint: sub.endpoint }).catch(() => {});
      await sub.unsubscribe();
    }
  } catch {}
  localStorage.removeItem("BT_PUSH_SUBSCRIBED");
}

// ── Banner — shown after login if not yet subscribed ─────────────────────────
export function PushPermissionBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem("BT_PUSH_SUBSCRIBED")) return;
    if (!localStorage.getItem("BT_TOKEN")) return; // logged-in only

    // Re-show after 30 days
    const dismissed = localStorage.getItem(PUSH_DISMISSED_KEY);
    if (dismissed && Date.now() - Number(dismissed) < PUSH_DISMISS_DAYS * 86400_000) return;

    const t = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(t);
  }, []);

  const handleAllow = async () => {
    setShow(false);
    const ok = await subscribeToPush();
    if (ok) toast.success("Notifications enabled!");
    else toast.error("Could not enable notifications. Check browser settings.");
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(PUSH_DISMISSED_KEY, String(Date.now()));
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] left-3 right-3 z-[60] lg:bottom-5 lg:left-auto lg:right-5 lg:max-w-sm"
        >
          <div className="bg-[#0A0876] rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">Enable Notifications</p>
                <p className="text-white/60 text-xs mt-0.5 leading-relaxed">
                  Get alerts for new messages, listings in your area, and booking updates.
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 active:bg-white/20"
                aria-label="Dismiss"
              >
                <X className="w-3 h-3 text-white/60" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAllow}
                className="flex-1 py-2.5 rounded-xl bg-white text-[#0A0876] font-bold text-sm active:scale-[0.98] transition-transform"
              >
                Allow
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 py-2.5 rounded-xl bg-white/15 text-white font-medium text-sm"
              >
                Not now
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Toggle button for settings/account pages ─────────────────────────────────
export function PushToggle() {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Sync with actual browser permission state, not just localStorage
    if (!("Notification" in window)) return;
    const stored = !!localStorage.getItem("BT_PUSH_SUBSCRIBED");
    const granted = Notification.permission === "granted";
    setSubscribed(stored && granted);
  }, []);

  const toggle = async () => {
    // iOS requires PWA to be installed for push
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;
    if (isIOS && !isStandalone && !subscribed) {
      toast("Add Beta Tenant to your home screen first to enable notifications", { duration: 5000 });
      return;
    }

    setLoading(true);
    if (subscribed) {
      await unsubscribeFromPush();
      setSubscribed(false);
      toast.success("Notifications disabled");
    } else {
      const ok = await subscribeToPush();
      setSubscribed(ok);
      if (ok) toast.success("Notifications enabled");
      else if (Notification.permission !== "denied") toast.error("Could not enable notifications");
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="flex items-center gap-3 w-full px-5 py-4 hover:bg-neutral-50 transition-colors disabled:opacity-60"
    >
      <div className="w-9 h-9 rounded-xl bg-bt-primary/10 flex items-center justify-center shrink-0">
        {subscribed ? <Bell className="w-4 h-4 text-bt-primary" /> : <BellOff className="w-4 h-4 text-neutral-400" />}
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold text-neutral-900">
          {subscribed ? "Notifications On" : "Enable Notifications"}
        </p>
        <p className="text-xs text-neutral-400 mt-0.5">
          {subscribed ? "Tap to turn off alerts" : "Get alerts for messages and new listings"}
        </p>
      </div>
      {/* Toggle switch — using inline style for exact positioning */}
      <div
        className={`w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${subscribed ? "bg-[#0A0876]" : "bg-neutral-200"}`}
        style={{ position: "relative" }}
      >
        <div
          className="w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform duration-200"
          style={{ transform: subscribed ? "translateX(22px)" : "translateX(2px)" }}
        />
      </div>
    </button>
  );
}
