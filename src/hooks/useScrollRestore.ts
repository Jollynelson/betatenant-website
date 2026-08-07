"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const scrollPositions: Record<string, number> = {};

/**
 * Saves scroll position when leaving a page, restores it when returning.
 * Key defaults to current pathname.
 */
export function useScrollRestore(key?: string) {
  const pathname = usePathname();
  const scrollKey = key ?? pathname;
  const restoredRef = useRef(false);

  // Save scroll on unmount / route change
  useEffect(() => {
    return () => {
      scrollPositions[scrollKey] = window.scrollY;
    };
  }, [scrollKey]);

  // Restore scroll after content loads (slight delay for paint)
  useEffect(() => {
    if (restoredRef.current) return;
    const saved = scrollPositions[scrollKey];
    if (saved && saved > 0) {
      const timer = setTimeout(() => {
        window.scrollTo({ top: saved, behavior: "instant" });
        restoredRef.current = true;
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [scrollKey]);
}
