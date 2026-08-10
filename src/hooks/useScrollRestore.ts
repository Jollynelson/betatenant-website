"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const SK = (key: string) => `BT_SCROLL_${key}`;

/**
 * Persists scroll position to sessionStorage on leave, restores on return.
 * Survives full page reloads — critical for static export back-navigation.
 */
export function useScrollRestore(key?: string) {
  const pathname = usePathname();
  const scrollKey = key ?? pathname;
  const restoredRef = useRef(false);

  // Save scroll position when leaving the page
  useEffect(() => {
    const save = () => {
      try { sessionStorage.setItem(SK(scrollKey), String(Math.round(window.scrollY))); } catch {}
    };
    // Save on unmount (route change)
    return save;
  }, [scrollKey]);

  // Also save when user switches tabs (covers mobile app-switch)
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        try { sessionStorage.setItem(SK(scrollKey), String(Math.round(window.scrollY))); } catch {}
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [scrollKey]);

  // Restore scroll after content mounts
  useEffect(() => {
    if (restoredRef.current) return;
    try {
      const saved = sessionStorage.getItem(SK(scrollKey));
      if (saved && Number(saved) > 60) {
        const timer = setTimeout(() => {
          window.scrollTo({ top: Number(saved), behavior: "instant" });
          restoredRef.current = true;
          sessionStorage.removeItem(SK(scrollKey));
        }, 60);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, [scrollKey]);
}
