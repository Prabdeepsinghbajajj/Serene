"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/user-context";
import type { WellnessState, SessionPhase } from "@/types/wellness";
import type { Json, WellnessEventType } from "@/types/database";

interface WellnessContextValue extends WellnessState {
  recordImpression: () => Promise<void>;
  acceptRest: () => void;
  declineRest: () => void;
  completedBreathing: () => void;
  /** Dev-only: override session_minutes for testing */
  _devSetMinutes?: (minutes: number) => void;
  _devSetDailyLimitReached?: () => void;
  _devReset?: () => void;
}

const WellnessContext = createContext<WellnessContextValue | null>(null);

const PHASE_THRESHOLDS = {
  soft_warning: 20,
  rest_required: 40,
  locked: 60,
} as const;

const DAILY_CAP = 30;

function minutesToPhase(minutes: number): SessionPhase {
  if (minutes >= PHASE_THRESHOLDS.locked) return "locked";
  if (minutes >= PHASE_THRESHOLDS.rest_required) return "rest_required";
  if (minutes >= PHASE_THRESHOLDS.soft_warning) return "soft_warning";
  return "normal";
}

export function WellnessProvider({ children }: { children: React.ReactNode }) {
  const { supabaseUser } = useUser();
  const supabase = createClient();
  const sessionStart = useRef<Date>(new Date());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPhaseRef = useRef<SessionPhase>("normal");
  // Keep supabaseUser in a ref so callbacks don't go stale
  const userRef = useRef(supabaseUser);
  useEffect(() => {
    userRef.current = supabaseUser;
  }, [supabaseUser]);

  const [state, setState] = useState<WellnessState>({
    session_start: new Date(),
    session_minutes: 0,
    phase: "normal",
    impressions_today: 0,
    daily_limit_reached: false,
    show_rest_screen: false,
  });

  /* ------------------------------------------------------------------ */
  /*  Supabase event logger                                               */
  /* ------------------------------------------------------------------ */
  const logEvent = useCallback(
    async (
      event_type: WellnessEventType,
      metadata: Record<string, Json> = {}
    ) => {
      const user = userRef.current;
      if (!user) return;
      await supabase.from("wellness_events").insert({
        user_id: user.id,
        event_type,
        metadata: metadata as Json,
      });
    },
    // supabase client is stable; userRef is a ref so no dep needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  /* ------------------------------------------------------------------ */
  /*  Fetch today's impression count on mount / user change              */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!supabaseUser) return;
    const fetchTodayImpressions = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("wellness_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", supabaseUser.id)
        .eq("event_type", "post_impression")
        .gte("created_at", todayStart.toISOString());
      setState((prev) => ({
        ...prev,
        impressions_today: count ?? 0,
        daily_limit_reached: (count ?? 0) >= DAILY_CAP,
      }));
    };
    fetchTodayImpressions();
    logEvent("session_start");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseUser?.id]);

  /* ------------------------------------------------------------------ */
  /*  Session timer — ticks every 60 seconds                             */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    tickRef.current = setInterval(() => {
      const minutes = Math.floor(
        (Date.now() - sessionStart.current.getTime()) / 60_000
      );

      setState((prev) => {
        const phase = minutesToPhase(minutes);
        const show_rest_screen =
          phase === "rest_required" || phase === "locked";

        // Log phase transitions exactly once
        if (phase !== prevPhaseRef.current) {
          if (phase === "soft_warning") {
            logEvent("rest_nudge_shown", { minutes: minutes as Json });
          }
          if (phase === "rest_required") {
            logEvent("rest_nudge_shown", { minutes: minutes as Json, level: "required" });
          }
          prevPhaseRef.current = phase;
        }

        return { ...prev, session_minutes: minutes, phase, show_rest_screen };
      });
    }, 60_000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      logEvent("session_end", {
        duration_minutes: Math.floor(
          (Date.now() - sessionStart.current.getTime()) / 60_000
        ),
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Page visibility — log tab hide/show                                */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        logEvent("session_end", { reason: "tab_hidden" });
      } else {
        logEvent("session_start", { reason: "tab_visible" });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Public actions                                                      */
  /* ------------------------------------------------------------------ */
  const recordImpression = useCallback(async () => {
    let hitCap = false;
    setState((prev) => {
      const impressions_today = prev.impressions_today + 1;
      const daily_limit_reached = impressions_today >= DAILY_CAP;
      if (daily_limit_reached && !prev.daily_limit_reached) {
        hitCap = true;
      }
      return { ...prev, impressions_today, daily_limit_reached };
    });
    if (hitCap) {
      await logEvent("daily_limit_reached", {});
    }
    await logEvent("post_impression");
  }, [logEvent]);

  const acceptRest = useCallback(() => {
    logEvent("rest_accepted", { phase: state.phase });
    sessionStart.current = new Date();
    prevPhaseRef.current = "normal";
    setState((prev) => ({
      ...prev,
      phase: "normal",
      show_rest_screen: false,
      session_minutes: 0,
    }));
  }, [state.phase, logEvent]);

  const declineRest = useCallback(() => {
    logEvent("rest_declined", { phase: state.phase });
    setState((prev) => ({ ...prev, show_rest_screen: false }));
    // Phase stays at rest_required/locked — banner dismissed but not resolved
  }, [state.phase, logEvent]);

  const completedBreathing = useCallback(() => {
    logEvent("breathing_completed");
  }, [logEvent]);

  /* ------------------------------------------------------------------ */
  /*  Dev-only overrides (stripped by tree-shaking in production)        */
  /* ------------------------------------------------------------------ */
  const _devSetMinutes = useCallback((minutes: number) => {
    const phase = minutesToPhase(minutes);
    prevPhaseRef.current = phase;
    setState((prev) => ({
      ...prev,
      session_minutes: minutes,
      phase,
      show_rest_screen: phase === "rest_required" || phase === "locked",
    }));
  }, []);

  const _devSetDailyLimitReached = useCallback(() => {
    setState((prev) => ({
      ...prev,
      impressions_today: DAILY_CAP,
      daily_limit_reached: true,
      show_rest_screen: false,
    }));
  }, []);

  const _devReset = useCallback(() => {
    sessionStart.current = new Date();
    prevPhaseRef.current = "normal";
    setState({
      session_start: new Date(),
      session_minutes: 0,
      phase: "normal",
      impressions_today: 0,
      daily_limit_reached: false,
      show_rest_screen: false,
    });
  }, []);

  return (
    <WellnessContext.Provider
      value={{
        ...state,
        recordImpression,
        acceptRest,
        declineRest,
        completedBreathing,
        _devSetMinutes,
        _devSetDailyLimitReached,
        _devReset,
      }}
    >
      {children}
    </WellnessContext.Provider>
  );
}

export function useWellness() {
  const ctx = useContext(WellnessContext);
  if (!ctx) throw new Error("useWellness must be used inside <WellnessProvider>");
  return ctx;
}
