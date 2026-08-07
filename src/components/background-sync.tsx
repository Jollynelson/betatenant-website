"use client";

/**
 * BackgroundSync — keeps key data fresh when the app regains focus.
 * Runs silently in the background, never shows a loader.
 *
 * Also handles the "came back after a long time" case:
 * if the app was backgrounded for > 10 min, force-refetch critical data.
 */

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { api, propertyApi } from "@/lib/api";
import { queryClient } from "@/components/providers";

const BACKGROUND_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

export function BackgroundSync() {
  const lastActiveRef = useRef(Date.now());
  const { token, user, setProfilePic } = useAuthStore();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const awayMs = Date.now() - lastActiveRef.current;

        if (awayMs > BACKGROUND_THRESHOLD_MS) {
          // Been away a while — invalidate time-sensitive data silently
          queryClient.invalidateQueries({ queryKey: ["home-listings"] });
          queryClient.invalidateQueries({ queryKey: ["chats"] });

          if (token) {
            queryClient.invalidateQueries({ queryKey: ["account-profile"] });
            if (user?.role === "agent" || user?.role === "landlord") {
              queryClient.invalidateQueries({ queryKey: ["my-listings"] });
              queryClient.invalidateQueries({ queryKey: ["boost-balance"] });
            }
          }
        } else {
          // Just briefly away — only refetch real-time data
          if (token) {
            queryClient.invalidateQueries({ queryKey: ["chats"] });
          }
        }
      } else {
        // Going to background — note the time
        lastActiveRef.current = Date.now();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [token, user]);

  // Sync profilePic into auth store if it loads fresh from the server
  useEffect(() => {
    if (!token) return;
    const unsub = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === "updated" &&
        event.query.queryKey[0] === "account-profile" &&
        event.query.state.data
      ) {
        const data: any = event.query.state.data;
        const pic = data?.profile?.profilePic ?? data?.profilePic;
        if (pic) setProfilePic(pic);
      }
    });
    return unsub;
  }, [token, setProfilePic]);

  return null; // purely background logic, no UI
}
