"use client";

import { Image as ImageIcon, Video, Type, Timer, Info } from "lucide-react";
import { useState } from "react";

type PostContentType = "photo" | "video" | "text" | "slow_post";

interface ContentTypeOption {
  type: PostContentType;
  icon: React.ReactNode;
  title: string;
  description: string;
  tooltip?: string;
}

const OPTIONS: ContentTypeOption[] = [
  {
    type: "photo",
    icon: <ImageIcon size={22} aria-hidden="true" />,
    title: "Photo",
    description: "Share a moment",
  },
  {
    type: "video",
    icon: <Video size={22} aria-hidden="true" />,
    title: "Video",
    description: "Up to 3 minutes",
  },
  {
    type: "text",
    icon: <Type size={22} aria-hidden="true" />,
    title: "Text",
    description: "A thought or reflection",
  },
  {
    type: "slow_post",
    icon: <Timer size={22} aria-hidden="true" />,
    title: "Slow post",
    description: "Delivered gradually over 48h",
    tooltip:
      "A slow post unfolds in your followers' feeds over 48 hours — a quieter, more intentional way to share.",
  },
];

interface ContentTypeSelectorProps {
  value: PostContentType | null;
  onChange: (type: PostContentType) => void;
}

export function ContentTypeSelector({
  value,
  onChange,
}: ContentTypeSelectorProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  return (
    <div
      className="grid grid-cols-2 gap-3"
      role="group"
      aria-label="Select content type"
    >
      {OPTIONS.map((opt) => {
        const selected = value === opt.type;
        return (
          // Using div+role="button" instead of <button> because the slow_post
          // card contains a child <button> (the info icon). Nested buttons are
          // invalid HTML and cause React hydration errors.
          <div
            key={opt.type}
            role="button"
            tabIndex={0}
            aria-pressed={selected}
            aria-label={opt.title}
            onClick={() => onChange(opt.type)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onChange(opt.type);
              }
            }}
            className={`relative flex min-h-[100px] cursor-pointer flex-col items-start justify-between gap-2 rounded-xl border-2 px-5 py-4 text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 ${
              selected
                ? "border-sage-400 bg-sage-100"
                : "border-transparent bg-cream-100 hover:bg-cream-200"
            }`}
          >
            <div className="flex items-start justify-between w-full">
              <span className="text-slate-warm">{opt.icon}</span>
              {opt.tooltip && (
                <button
                  type="button"
                  aria-label="Learn more about slow posts"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTooltipOpen((v) => !v);
                  }}
                  className="text-slate-hint hover:text-slate-muted transition-colors -mt-1 -mr-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 rounded"
                >
                  <Info size={14} aria-hidden="true" />
                </button>
              )}
            </div>
            <div>
              <p className="font-sans text-base font-medium text-slate-warm">
                {opt.title}
              </p>
              <p className="font-sans text-sm text-slate-muted">
                {opt.description}
              </p>
            </div>
          </div>
        );
      })}

      {/* Tooltip panel for slow_post */}
      {tooltipOpen && (
        <div className="col-span-2 rounded-xl bg-sage-100 border border-sage-200 px-5 py-4">
          <p className="font-sans text-sm text-sage-800 leading-relaxed">
            {OPTIONS.find((o) => o.tooltip)?.tooltip}
          </p>
          <button
            type="button"
            onClick={() => setTooltipOpen(false)}
            className="mt-2 font-sans text-xs text-sage-600 hover:text-sage-800 transition-colors focus:outline-none"
          >
            Got it
          </button>
        </div>
      )}
    </div>
  );
}
