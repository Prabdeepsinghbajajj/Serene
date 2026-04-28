/**
 * Session phases correspond to the time thresholds in bible §7.
 *
 * normal       — 0–19 minutes: no intervention
 * soft_warning — 20–39 minutes: soft top banner (dismissible with one tap)
 * rest_required — 40–59 minutes: full-screen rest screen (5-second minimum before dismiss)
 * locked       — 60+ minutes: feed locked for 10 minutes, breathing exercise shown
 */
export type SessionPhase =
  | "normal"
  | "soft_warning"
  | "rest_required"
  | "locked";

export interface WellnessState {
  /** ISO timestamp of when the current session started */
  session_start: Date;
  /** Minutes elapsed in the current session */
  session_minutes: number;
  /** Current phase based on session_minutes thresholds */
  phase: SessionPhase;
  /** Number of post impressions logged today (bible §7: cap is 30) */
  impressions_today: number;
  /** True when impressions_today >= 30 */
  daily_limit_reached: boolean;
  /** Controls whether the rest screen overlay is visible */
  show_rest_screen: boolean;
}
