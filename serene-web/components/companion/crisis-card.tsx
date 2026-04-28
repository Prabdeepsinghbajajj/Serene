"use client";

import { Heart } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  CrisisCard — never dismissable, stays permanently (§9 hard requirement)   */
/* -------------------------------------------------------------------------- */
export function CrisisCard() {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-xl border-2 border-amber-warm bg-cream-50 p-6 space-y-3 my-2"
    >
      {/* Icon */}
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-warm/20">
        <Heart size={16} className="text-amber-warm" aria-hidden="true" />
      </div>

      {/* Headline */}
      <p className="font-sans font-[500] text-slate-warm">
        It sounds like things might feel heavy right now.
      </p>

      {/* Body */}
      <p className="font-sans text-sm text-slate-muted leading-[1.7]">
        You don&apos;t have to carry this alone. Here are some people who are
        trained to help:
      </p>

      {/* Resource list */}
      <ul className="space-y-2 mt-1">
        {[
          {
            label: "Crisis Text Line",
            detail: "Text HOME to 741741",
            href: null,
          },
          {
            label: "International helplines",
            detail: "iasp.info/resources/Crisis_Centres",
            href: "https://www.iasp.info/resources/Crisis_Centres/",
          },
          {
            label: "Emergency services",
            detail: "Call your local emergency number",
            href: null,
          },
        ].map((resource) => (
          <li key={resource.label} className="flex items-start gap-2">
            <span
              className="mt-[0.4rem] h-1.5 w-1.5 rounded-full bg-sage-600 flex-shrink-0"
              aria-hidden="true"
            />
            <span className="font-sans text-sm text-slate-warm">
              <span className="font-[500]">{resource.label}</span>
              {" — "}
              {resource.href ? (
                <a
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sage-600 underline underline-offset-2 hover:text-sage-800"
                >
                  {resource.detail}
                </a>
              ) : (
                resource.detail
              )}
            </span>
          </li>
        ))}
      </ul>

      {/* Footer note */}
      <p className="font-sans text-xs text-slate-hint pt-1">
        This message will stay here in case you need it.
      </p>
    </div>
  );
}
