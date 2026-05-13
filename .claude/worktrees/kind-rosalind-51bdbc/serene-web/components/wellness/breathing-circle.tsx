"use client";

import { useEffect, useRef, useState } from "react";
import { useWellness } from "@/context/wellness-context";

type BreathPhase = "inhale" | "hold" | "exhale";

interface BreathingCircleProps {
  /** Called after one full 12-second cycle (inhale → hold → exhale) */
  onComplete?: () => void;
  /** Override circle colour for use on dark backgrounds (e.g. rest screen) */
  dark?: boolean;
}

const PHASE_DURATION: Record<BreathPhase, number> = {
  inhale: 4000,
  hold: 4000,
  exhale: 4000,
};

const PHASE_SEQUENCE: BreathPhase[] = ["inhale", "hold", "exhale"];

const PHASE_LABEL: Record<BreathPhase, string> = {
  inhale: "Breathe in",
  hold: "Hold",
  exhale: "Breathe out",
};

const MIN_RADIUS = 30;
const MAX_RADIUS = 52;

export function BreathingCircle({ onComplete, dark = false }: BreathingCircleProps) {
  const { completedBreathing } = useWellness();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [radius, setRadius] = useState(MIN_RADIUS);
  const cycleCountRef = useRef(0);
  const hasCalledComplete = useRef(false);

  const phase = PHASE_SEQUENCE[phaseIndex % PHASE_SEQUENCE.length];

  // Advance to next phase after each phase's duration
  useEffect(() => {
    const duration = PHASE_DURATION[phase];

    // Update radius immediately for CSS transition to pick up
    if (phase === "inhale") setRadius(MAX_RADIUS);
    else if (phase === "exhale") setRadius(MIN_RADIUS);
    // hold: radius stays at MAX_RADIUS from previous inhale

    const t = setTimeout(() => {
      const nextIndex = phaseIndex + 1;
      setPhaseIndex(nextIndex);

      // After each full cycle (every 3 phases), track completion
      if ((nextIndex % 3 === 0) && !hasCalledComplete.current) {
        cycleCountRef.current += 1;
        if (cycleCountRef.current >= 1) {
          hasCalledComplete.current = true;
          completedBreathing();
          onComplete?.();
        }
      }
    }, duration);

    return () => clearTimeout(t);
  }, [phaseIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const strokeColor = dark ? "#F0E9DA" : "#87AA7E"; // cream-200 or sage-400
  const fillColor = dark ? "rgba(255,255,255,0.10)" : "rgba(232,239,228,0.6)"; // white/10 or sage-100/60

  return (
    <div className="flex flex-col items-center gap-3" aria-live="polite" aria-label={PHASE_LABEL[phase]}>
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        aria-hidden="true"
        className="overflow-visible"
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="2"
          style={{
            transition: `r ${PHASE_DURATION[phase] / 1000}s ease-in-out`,
          }}
        />
      </svg>
      <p
        className={`font-sans text-xs tracking-wide ${
          dark ? "text-cream-200" : "text-sage-600"
        }`}
      >
        {PHASE_LABEL[phase]}
      </p>
    </div>
  );
}
