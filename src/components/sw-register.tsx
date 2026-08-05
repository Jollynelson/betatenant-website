"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

// App Badge API — call from anywhere to update the badge count
export function setAppBadge(count: number) {
  if (!("setAppBadge" in navigator)) return;
  if (count > 0) {
    (navigator as any).setAppBadge(count).catch(() => {});
  } else {
    (navigator as any).clearAppBadge().catch(() => {});
  }
}

export function SWRegister() {
  const refreshing = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    let updateTimer: ReturnType<typeof setTimeout>;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              toast(
                (t) => (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-neutral-700 font-medium">Update available</span>
                    <button
                      onClick={() => {
                        newWorker.postMessage({ type: "SKIP_WAITING" });
                        toast.dismiss(t.id);
                        clearTimeout(updateTimer);
                      }}
                      className="text-sm font-bold text-[#0A0876] shrink-0"
                    >
                      Update now
                    </button>
                  </div>
                ),
                { duration: Infinity, id: "sw-update" }
              );

              // Auto-apply after 24h if user never clicked
              updateTimer = setTimeout(() => {
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }, 24 * 60 * 60 * 1000);
            }
          });
        });

        // Poll for updates every 60s when visible
        let interval: ReturnType<typeof setInterval>;
        const startChecking = () => {
          clearInterval(interval);
          interval = setInterval(() => reg.update().catch(() => {}), 60_000);
        };
        const stopChecking = () => clearInterval(interval);

        document.addEventListener("visibilitychange", () => {
          document.visibilityState === "visible" ? startChecking() : stopChecking();
        });
        startChecking();

        // Persistent storage — prevents browser from evicting caches
        if (navigator.storage?.persist) {
          const granted = await navigator.storage.persist().catch(() => false);
          if (!granted) {
            // Still request estimate so we know what we have
            navigator.storage.estimate().catch(() => {});
          }
        }

      } catch {}
    };

    // Reload cleanly when SW controller changes (after user clicks "Update now")
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing.current) return;
      refreshing.current = true;
      window.location.reload();
    });

    register();

    return () => clearTimeout(updateTimer);
  }, []);

  return null;
}
