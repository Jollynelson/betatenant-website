"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, X } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

const VAPID_PUBLIC_KEY = "BL3sf9qSiYidsgmd1zBX4Zk2KbmllVtAxi8oh3OhgKcxkndtG0KXQusyyqxfDp-rBonip4QhyUV-wUqePMo0KXE";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function subscribeToPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });

    const subJson = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
    await api.post("/v1/user/push-subscribe", { subscription: subJson });
    localStorage.setItem("BT_PUSH_SUBSCRIBED", "1");
    return true;
  } catch {
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await api.post("/v1/user/push-unsubscribe", { endpoint: sub.endpoint }).catch(() => {});
    await sub.unsubscribe();
  }
  localStorage.removeItem("BT_PUSH_SUBSCRIBED");
}

// ── Prompt banner — shown once after login if not yet subscribed ──────────────
export function PushPermissionBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem("BT_PUSH_SUBSCRIBED")) return;
    if (localStorage.getItem("BT_PUSH_DISMISSED")) return;
    if (!localStorage.getItem("BT_TOKEN")) return; // only for logged-in users

    // Show after 5 seconds
    const t = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(t);
  }, []);

  const handleAllow = async () => {
    setShow(false);
    const ok = await subscribeToPush();
    if (ok) {
      toast.success("Notifications enabled! You'll hear about new messages and listings.");
    } else {
      toast.error("Could not enable notifications. Check your browser settings.");
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("BT_PUSH_DISMISSED", "1");
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          className="fixed bottom-[72px] left-3 right-3 z-[60] lg:bottom-5 lg:left-auto lg:right-5 lg:w-[360px]"
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
              >
                <X className="w-3 h-3 text-white/60" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAllow}
                className="flex-1 py-2.5 rounded-xl bg-white text-bt-primary font-bold text-sm active:scale-[0.98] transition-transform"
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

// ── Bell toggle button — for account/settings pages ──────────────────────────
export function PushToggle() {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSubscribed(!!localStorage.getItem("BT_PUSH_SUBSCRIBED"));
  }, []);

  const toggle = async () => {
    setLoading(true);
    if (subscribed) {
      await unsubscribeFromPush();
      setSubscribed(false);
      toast.success("Notifications disabled");
    } else {
      const ok = await subscribeToPush();
      setSubscribed(ok);
      if (ok) toast.success("Notifications enabled");
      else toast.error("Could not enable notifications");
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="flex items-center gap-3 w-full px-5 py-4 hover:bg-neutral-50 transition-colors"
    >
      <div className="w-9 h-9 rounded-xl bg-bt-primary/6 flex items-center justify-center shrink-0">
        {subscribed ? <Bell className="w-4 h-4 text-bt-primary" /> : <BellOff className="w-4 h-4 text-neutral-400" />}
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold text-neutral-900">
          {subscribed ? "Notifications On" : "Enable Notifications"}
        </p>
        <p className="text-xs text-neutral-400 mt-0.5">
          {subscribed ? "You'll be notified of messages and listings" : "Get alerts for messages and new listings"}
        </p>
      </div>
      <div className={`w-11 h-6 rounded-full transition-colors ${subscribed ? "bg-bt-primary" : "bg-neutral-200"}`}>
        <div className={`w-5 h-5 rounded-full bg-white shadow-sm mt-0.5 transition-transform ${subscribed ? "translate-x-5.5 ml-0.5" : "translate-x-0.5"}`} />
      </div>
    </button>
  );
}
