import { createClient } from "@/lib/supabase/server";
import type { MoodTag } from "@/types/ai";
import type { Json } from "@/types/database";

interface MoodHistoryEntry {
  mood: MoodTag;
  timestamp: string;
}

/**
 * Append a mood tag to the user's personality_profile.mood_history,
 * keeping only the most recent 30 entries (bible §4).
 *
 * Called server-side only — personality_profiles is private per §11.
 */
export async function appendMoodHistory(
  userId: string,
  moodTag: MoodTag
): Promise<void> {
  const supabase = createClient();
  if (!supabase) return; // no-op if Supabase is not configured

  const { data } = await supabase
    .from("personality_profiles")
    .select("mood_history")
    .eq("user_id", userId)
    .single();

  const history: MoodHistoryEntry[] = Array.isArray(data?.mood_history)
    ? (data.mood_history as unknown as MoodHistoryEntry[])
    : [];

  history.push({ mood: moodTag, timestamp: new Date().toISOString() });

  // Prune to last 30 entries only (auto-prune per bible §4)
  const pruned = history.slice(-30);

  await supabase
    .from("personality_profiles")
    .update({ mood_history: pruned as unknown as Json })
    .eq("user_id", userId);
}
