import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client — bypasses RLS.
 * SECURITY: Must only be imported in server-side code (Route Handlers, Edge
 * Functions, Server Actions). Never expose service key to the browser.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient() must not be called in the browser. Import this only from server-side files."
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SERENE_SUPABASE_URL!,
    process.env.SERENE_SUPABASE_SERVICE_KEY!
  );
}
