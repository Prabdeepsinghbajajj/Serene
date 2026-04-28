"use client";

// Dev-only: testing dashboard for the Wellness Engine
// NOT linked from nav — accessible at /wellness-test in dev mode

import { useWellness } from "@/context/wellness-context";
import type { SessionPhase } from "@/types/wellness";

// Phase colour mapping — no red anywhere (bible §6)
const PHASE_COLOURS: Record<SessionPhase, string> = {
  normal: "bg-cream-100 text-slate-warm border-cream-200",
  soft_warning: "bg-sage-100 text-sage-800 border-sage-200",
  rest_required: "bg-sky-soft text-sky-deep border-sky-mid",
  locked: "bg-amber-warm/20 text-slate-warm border-amber-warm",
};

function Badge({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-sans text-xs text-slate-hint uppercase tracking-wide">
        {label}
      </span>
      <span className="font-sans text-sm font-medium text-slate-warm">
        {String(value)}
      </span>
    </div>
  );
}

export default function WellnessTestPage() {
  const {
    session_minutes,
    phase,
    impressions_today,
    daily_limit_reached,
    show_rest_screen,
    _devSetMinutes,
    _devSetDailyLimitReached,
    _devReset,
  } = useWellness();

  return (
    <main className="min-h-screen bg-cream-50 px-8 py-12 space-y-10 max-w-2xl mx-auto">
      {/* Dev banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg px-6 py-4">
        <p className="font-sans text-sm font-medium text-red-700">
          Dev reference only — not accessible in production navigation
        </p>
      </div>

      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-medium text-slate-warm">
          Wellness Engine Test
        </h1>
        <p className="font-sans text-base text-slate-muted">
          Manually test all session thresholds and daily cap behaviour.
        </p>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Current state                                                     */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-4">
        <h2 className="font-sans text-sm font-medium text-slate-hint uppercase tracking-wide">
          Current WellnessState
        </h2>

        <div
          className={`rounded-xl border px-6 py-4 grid grid-cols-2 gap-4 sm:grid-cols-3 transition-colors duration-500 ${PHASE_COLOURS[phase]}`}
        >
          <Badge label="session_minutes" value={session_minutes} />
          <Badge label="phase" value={phase} />
          <Badge label="impressions_today" value={impressions_today} />
          <Badge
            label="daily_limit_reached"
            value={String(daily_limit_reached)}
          />
          <Badge
            label="show_rest_screen"
            value={String(show_rest_screen)}
          />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Active components indicator                                       */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-3">
        <h2 className="font-sans text-sm font-medium text-slate-hint uppercase tracking-wide">
          Active Wellness Components
        </h2>
        <div className="flex flex-wrap gap-3">
          {[
            {
              label: "SessionBanner",
              active: phase === "soft_warning",
              colour: "bg-sage-100 border-sage-200 text-sage-800",
            },
            {
              label: "RestScreen",
              active: show_rest_screen,
              colour: "bg-sky-soft border-sky-mid text-sky-deep",
            },
            {
              label: "DailyLimitScreen",
              active: daily_limit_reached && !show_rest_screen,
              colour: "bg-cream-100 border-cream-200 text-slate-warm",
            },
          ].map(({ label, active, colour }) => (
            <div
              key={label}
              className={`rounded-lg border px-4 py-2 font-sans text-sm font-medium transition-all ${
                active
                  ? colour
                  : "bg-cream-50 border-cream-200 text-slate-hint"
              }`}
            >
              {label}{" "}
              <span className="text-xs">{active ? "● active" : "○ inactive"}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Manual controls — slider                                         */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-4">
        <h2 className="font-sans text-sm font-medium text-slate-hint uppercase tracking-wide">
          Set Session Minutes (slider)
        </h2>
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={70}
            value={session_minutes}
            onChange={(e) => _devSetMinutes?.(Number(e.target.value))}
            className="w-full accent-sage-400"
            aria-label="Session minutes"
          />
          <div className="flex justify-between font-sans text-xs text-slate-hint">
            <span>0</span>
            <span className="text-sage-600">20 (banner)</span>
            <span className="text-sky-deep">40 (rest)</span>
            <span className="text-slate-warm">60 (locked)</span>
            <span>70</span>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Quick-trigger buttons                                             */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-4">
        <h2 className="font-sans text-sm font-medium text-slate-hint uppercase tracking-wide">
          Quick Triggers
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => _devSetMinutes?.(20)}
            className="rounded-lg bg-sage-100 border border-sage-200 px-5 py-2.5 font-sans text-sm text-sage-800 hover:bg-sage-200 transition-colors"
          >
            Simulate 20 min
          </button>
          <button
            onClick={() => _devSetMinutes?.(40)}
            className="rounded-lg bg-sky-soft border border-sky-mid px-5 py-2.5 font-sans text-sm text-sky-deep hover:bg-sky-mid/30 transition-colors"
          >
            Simulate 40 min
          </button>
          <button
            onClick={() => _devSetMinutes?.(60)}
            className="rounded-lg bg-cream-100 border border-cream-200 px-5 py-2.5 font-sans text-sm text-slate-warm hover:bg-cream-200 transition-colors"
          >
            Simulate 60 min
          </button>
          <button
            onClick={() => _devSetDailyLimitReached?.()}
            className="rounded-lg bg-amber-warm/20 border border-amber-warm px-5 py-2.5 font-sans text-sm text-slate-warm hover:bg-amber-warm/30 transition-colors"
          >
            Fill daily cap
          </button>
          <button
            onClick={() => _devReset?.()}
            className="rounded-lg bg-cream-100 border border-cream-200 px-5 py-2.5 font-sans text-sm text-slate-muted hover:bg-cream-200 transition-colors"
          >
            Reset session
          </button>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Expected behaviour notes                                         */}
      {/* ---------------------------------------------------------------- */}
      <section className="rounded-xl bg-cream-100 border border-cream-200 px-6 py-5 space-y-3">
        <h2 className="font-sans text-sm font-medium text-slate-hint uppercase tracking-wide">
          Expected Behaviour
        </h2>
        <ul className="space-y-2 font-sans text-sm text-slate-muted list-disc list-inside">
          <li>
            <strong className="text-slate-warm">20 min</strong> → SessionBanner
            slides down from top. Dismiss with X.
          </li>
          <li>
            <strong className="text-slate-warm">40 min</strong> → RestScreen
            appears. &quot;Keep browsing&quot; is hidden for 5 s then appears.
          </li>
          <li>
            <strong className="text-slate-warm">60 min</strong> → RestScreen
            appears with lock icon. &quot;Keep browsing&quot; button is
            absent entirely.
          </li>
          <li>
            <strong className="text-slate-warm">Daily cap (30)</strong> →
            DailyLimitScreen fades in. No close button, no countdown.
          </li>
          <li>
            <strong className="text-slate-warm">RestScreen takes priority</strong>{" "}
            over DailyLimitScreen when both are active.
          </li>
          <li>
            Clicking &quot;I&apos;m done for now&quot; resets session to 0 min.
          </li>
        </ul>
      </section>
    </main>
  );
}
