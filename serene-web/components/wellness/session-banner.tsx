"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useWellness } from "@/context/wellness-context";

export function SessionBanner() {
  const { phase, declineRest } = useWellness();
  const visible = phase === "soft_warning";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="session-banner"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed top-0 left-0 right-0 z-40"
          style={{
            background: "rgba(78,122,68,0.15)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(78,122,68,0.20)",
          }}
        >
          <div className="flex items-center justify-between px-6 py-3">
            <p className="font-sans text-sm text-sage-300">
              You&apos;ve been here a while — everything you needed to see is
              here.
            </p>
            <button
              onClick={declineRest}
              aria-label="Dismiss"
              className="ml-4 flex-shrink-0 text-sage-300/60 hover:text-sage-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300 rounded"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
