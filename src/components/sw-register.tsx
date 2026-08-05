"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

export function SWRegister() {
  const refreshing = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

        // Handle update available — show a non-blocking toast
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              toast(
                (t) => (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-neutral-700">New version ready</span>
                    <button
                      onClick={() => {
                        newWorker.postMessage({ type: "SKIP_WAITING" });
                        toast.dismiss(t.id);
                      }}
                      className="text-sm font-bold text-[#0A0876] shrink-0"
                    >
                      Refresh
                    </button>
                  </div>
                ),
                { duration: Infinity, id: "sw-update" }
              );
            }
          });
        });

        // Poll for updates every 60s when tab is visible
        let interval: ReturnType<typeof setInterval>;
        const startChecking = () => {
          clearInterval(interval);
          interval = setInterval(() => reg.update().catch(() => {}), 60_000);
        };
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") startChecking();
          else clearInterval(interval);
        });
        startChecking();

        // Request persistent storage so cache survives browser eviction
        if (navigator.storage?.persist) {
          navigator.storage.persist().catch(() => {});
        }

      } catch {}
    };

    // Reload once when controller changes (after user clicks "Refresh")
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing.current) return;
      refreshing.current = true;
      window.location.reload();
    });

    register();
  }, []);

  return null;
}
