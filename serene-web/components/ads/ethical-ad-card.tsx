"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { ServedAd } from "@/types/ads";

interface EthicalAdCardProps {
  ad: ServedAd;
  onDismiss: (reason: "not_for_me" | "irrelevant" | "offensive") => void;
}

export function EthicalAdCard({ ad, onDismiss }: EthicalAdCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showReplacement, setShowReplacement] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  async function handleDismiss(reason: "not_for_me" | "irrelevant" | "offensive") {
    if (dismissing) return;
    setDismissing(true);
    onDismiss(reason);

    try {
      await fetch("/api/ads/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          impression_id: ad.impression_id,
          ad_id: ad.id,
          reason,
          ad_categories: ad.allowed_categories ?? [],
        }),
      });
    } catch {
      // Fire-and-forget — UI already updated optimistically
    }

    setDismissed(true);
    setShowReplacement(true);
    setTimeout(() => setShowReplacement(false), 3000);
  }

  async function handleCtaClick() {
    try {
      await fetch("/api/ads/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ impression_id: ad.impression_id }),
      });
    } catch {
      // Fire-and-forget
    }
    if (ad.cta_url) {
      window.open(ad.cta_url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <AnimatePresence mode="wait">
      {showReplacement ? (
        <motion.div
          key="replacement"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-cream-200 bg-card flex items-center justify-center py-6"
        >
          <p className="font-sans text-sm text-slate-muted text-center px-6">
            Got it — you won&apos;t see this type again.
          </p>
        </motion.div>
      ) : !dismissed ? (
        <motion.div
          key="card"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.3 }}
          className="relative rounded-xl border border-cream-200 bg-card p-4"
        >
          {/* Partner label — never "Ad" or "Sponsored" (§10) */}
          <span className="absolute top-3 right-3 font-sans text-xs text-slate-hint uppercase tracking-wide">
            Partner
          </span>

          {/* Ad image */}
          {ad.image_url && (
            <div className="overflow-hidden rounded-lg mb-3">
              <Image
                src={ad.image_url}
                alt={ad.headline}
                width={600}
                height={300}
                className="w-full object-cover max-h-48 rounded-lg"
                unoptimized
              />
            </div>
          )}

          {/* Headline */}
          <p className="font-sans font-[500] text-slate-warm text-base pr-14">
            {ad.headline}
          </p>

          {/* Body */}
          {ad.body && (
            <p className="font-sans text-slate-muted text-sm mt-1 line-clamp-2 leading-[1.7]">
              {ad.body}
            </p>
          )}

          {/* CTA — no urgency, no countdown (§10) */}
          {ad.cta_url && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCtaClick}
                className="font-sans text-sage-600 border-sage-400 hover:bg-sage-100"
              >
                {ad.cta_text ?? "Learn more"}
              </Button>
            </div>
          )}

          {/* Bottom row */}
          <div className="mt-3 flex items-center justify-between">
            {/* "Why this ad?" — reveals a vague interest match, never raw targeting data (§11) */}
            <button
              type="button"
              onClick={() => setShowWhy((v) => !v)}
              className="font-sans text-xs text-slate-hint hover:text-slate-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 rounded"
            >
              Why this ad?
            </button>

            <button
              type="button"
              onClick={() => handleDismiss("not_for_me")}
              disabled={dismissing}
              className="font-sans text-xs text-slate-hint hover:text-slate-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 rounded disabled:opacity-40"
            >
              Not for me
            </button>
          </div>

          {/* "Why this ad?" explanation panel */}
          <AnimatePresence>
            {showWhy && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 rounded-lg bg-sage-100 p-3">
                  <p className="font-sans text-sm text-slate-muted leading-[1.7]">
                    This partner aligns with some of your interests on Serene.
                    Targeting uses only your activity here — never data from
                    outside Serene.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
