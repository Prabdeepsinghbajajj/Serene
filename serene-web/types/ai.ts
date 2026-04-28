import type { MoodTag } from "@/types/database";

/** Re-export MoodTag so callers can import it from @/types/ai alongside other AI types */
export type { MoodTag };

/* -------------------------------------------------------------------------- */
/*  Companion chat types                                                        */
/* -------------------------------------------------------------------------- */

export interface CompanionMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface CompanionSession {
  messages: CompanionMessage[];
  isStreaming: boolean;
  error: string | null;
}

export type CrisisKeyword =
  | "harm"
  | "suicide"
  | "end it"
  | "hurt myself"
  | "kill myself"
  | "don't want to be here";

/* -------------------------------------------------------------------------- */
/*  Post companion types                                                        */
/* -------------------------------------------------------------------------- */

export interface PostCompanionResponse {
  /** The companion's message about the post (bible §9: specific, never generic) */
  message: string;
  /** Mood inferred from the caption + media context; null if indeterminate */
  mood_detected: MoodTag | null;
}
