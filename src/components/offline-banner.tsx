"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBack, setShowBack] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsOnline(navigator.onLine);

    const handleOffline = () => {
      setIsOnline(false);
      setShowBack(false);
    };
    const handleOnline = () => {
      setIsOnline(true);
      setShowBack(true);
      setTimeout(() => setShowBack(false), 3000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {(!isOnline || showBack) && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 400 }}
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 py-2.5 text-white text-sm font-medium"
          style={{ background: isOnline ? "#12B76A" : "#1a1a1a" }}
        >
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4" />
              Back online
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              No connection — showing cached content
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
