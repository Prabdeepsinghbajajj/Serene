"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { UserSearch } from "@/components/search/user-search";

interface MobileSearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSearchOverlay({ open, onClose }: MobileSearchOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-[#1A1A18] md:hidden"
          initial={{ y: "-100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ type: "tween", duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="Search people"
        >
          <div
            className="flex shrink-0 items-start gap-2 border-b border-white/[0.06] px-4 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
          >
            <div className="min-w-0 flex-1 pt-0.5">
              <UserSearch
                inputSize="large"
                autoFocus
                onAfterNavigate={onClose}
                className="w-full"
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300"
              aria-label="Close search"
            >
              <X size={22} aria-hidden />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
