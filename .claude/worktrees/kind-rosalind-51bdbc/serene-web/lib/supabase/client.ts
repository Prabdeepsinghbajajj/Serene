import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Browser (Client Component) Supabase client. Never use in Server Components.
 *
 * Falls back to placeholder values when env vars are not configured (e.g.
 * during `next build` without real credentials, or local dev). The client will
 * initialise without throwing; actual API calls will fail gracefully and the
 * form error states will surface the issue to the user.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SERENE_SUPABASE_URL ||
      "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SERENE_SUPABASE_ANON_KEY || "placeholder-key"
  );
}
