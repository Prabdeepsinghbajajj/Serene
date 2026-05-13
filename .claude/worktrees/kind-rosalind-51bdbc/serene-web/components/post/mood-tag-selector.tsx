"use client";

import type { MoodTag } from "@/types/database";

const MOOD_OPTIONS: { emoji: string; label: string; value: MoodTag }[] = [
  { emoji: "🌟", label: "Joyful", value: "joyful" },
  { emoji: "🙏", label: "Grateful", value: "grateful" },
  { emoji: "🌿", label: "Peaceful", value: "peaceful" },
  { emoji: "💭", label: "Reflective", value: "reflective" },
  { emoji: "🎨", label: "Creative", value: "creative" },
  { emoji: "🏔", label: "Adventurous", value: "adventurous" },
];

interface MoodTagSelectorProps {
  value: MoodTag | null;
  onChange: (tag: MoodTag) => void;
}

export function MoodTagSelector({ value, onChange }: MoodTagSelectorProps) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 gap-3"
      role="group"
      aria-label="Select a mood"
    >
      {MOOD_OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={selected}
            aria-label={opt.label}
            onClick={() => onChange(opt.value)}
            className={`flex min-h-[80px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-4 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 ${
              selected
                ? "border-sage-400 bg-sage-100"
                : "border-transparent bg-cream-100 hover:bg-cream-200"
            }`}
          >
            <span className="text-2xl" aria-hidden="true">
              {opt.emoji}
            </span>
            <span className="font-sans text-sm text-slate-warm font-medium">
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
