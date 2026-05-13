"use client";

import { motion } from "framer-motion";
import { useWellness } from "@/context/wellness-context";

// Inline leaf SVG — no image fetch, no external dependency
function LeafIllustration() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
    >
      {/* Simple stylised leaf shape */}
      <path
        d="M40 70 C20 70 10 55 10 38 C10 20 25 8 40 8 C55 8 70 20 70 38 C70 55 60 70 40 70Z"
        fill="#C9DBC2"
        opacity="0.7"
      />
      {/* Leaf vein */}
      <path
        d="M40 68 C40 68 40 25 40 12"
        stroke="#87AA7E"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M40 45 C34 38 22 36 16 32"
        stroke="#87AA7E"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M40 38 C46 31 58 29 64 25"
        stroke="#87AA7E"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M40 55 C33 50 21 50 14 48"
        stroke="#87AA7E"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

export function DailyLimitScreen() {
  const { daily_limit_reached, show_rest_screen } = useWellness();

  // Rest screen takes priority — only show this when rest screen is not active
  if (!daily_limit_reached || show_rest_screen) return null;

  return (
    <motion.div
      key="daily-limit"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-50 bg-cream-50 flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center text-center max-w-sm px-8">
        <LeafIllustration />

        <h1 className="font-serif text-3xl font-medium text-slate-warm mt-8 leading-snug">
          You&apos;ve seen everything from today.
        </h1>

        <p className="font-sans text-base text-slate-muted leading-[1.7] mt-4">
          Good things are waiting tomorrow. Rest well.
        </p>

        <p className="font-sans text-sm text-slate-hint mt-8">
          Your feed refreshes at midnight.
        </p>
      </div>
    </motion.div>
  );
}
