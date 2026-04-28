"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { useWellness } from "@/context/wellness-context";
import { BreathingCircle } from "@/components/wellness/breathing-circle";
import { Button } from "@/components/ui/button";

const NATURE_KEYWORDS = [
  "forest",
  "ocean",
  "mountain",
  "meadow",
  "sky",
  "lake",
] as const;

// Deterministic by day-of-week so image is stable within a session but changes daily
const todayKeyword =
  NATURE_KEYWORDS[new Date().getDay() % NATURE_KEYWORDS.length];

const AFFIRMING_MESSAGES = [
  "This moment is yours.",
  "You've seen what matters today.",
  "Rest is part of the practice.",
  "The feed will be here tomorrow.",
  "You've done enough today.",
  "Take a breath. You're okay.",
  "Good things don't expire.",
  "Stillness is underrated.",
];

export function RestScreen() {
  const { show_rest_screen, phase, session_minutes, acceptRest, declineRest } =
    useWellness();

  // "Keep browsing" button only appears after 5 seconds
  const [keepVisible, setKeepVisible] = useState(false);

  useEffect(() => {
    if (!show_rest_screen) {
      setKeepVisible(false);
      return;
    }
    const t = setTimeout(() => setKeepVisible(true), 5_000);
    return () => clearTimeout(t);
  }, [show_rest_screen]);

  const message =
    AFFIRMING_MESSAGES[session_minutes % AFFIRMING_MESSAGES.length];
  const isLocked = phase === "locked";

  if (!show_rest_screen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Take a rest"
    >
      {/* Background nature image */}
      <div
        className="absolute inset-0 bg-sage-800 bg-cover bg-center"
        style={{
          backgroundImage: `url(https://source.unsplash.com/1920x1080/?${todayKeyword})`,
        }}
      />

      {/* Semi-transparent sage overlay */}
      <div className="absolute inset-0 bg-sage-800/60" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm px-8 py-12">
        {isLocked && (
          <Lock
            size={20}
            className="text-cream-200 mb-4"
            aria-hidden="true"
          />
        )}

        <h2 className="font-serif text-2xl font-medium text-cream-50 leading-snug">
          {message}
        </h2>

        <p className="font-sans text-sm text-cream-200 mt-2">
          {isLocked
            ? "Come back in a little while."
            : "A moment to pause."}
        </p>

        <div className="mt-8">
          <BreathingCircle dark />
        </div>

        <div className="mt-10 flex flex-col gap-3 w-full">
          <Button
            onClick={acceptRest}
            className="w-full bg-cream-50 text-sage-800 hover:bg-cream-100 border-0"
            size="lg"
          >
            I&apos;m done for now
          </Button>

          {/* Never shown when locked */}
          {!isLocked && keepVisible && (
            <Button
              onClick={declineRest}
              variant="ghost"
              className="w-full text-cream-200 hover:text-cream-50 hover:bg-white/10"
              size="lg"
            >
              Keep browsing
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
