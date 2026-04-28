import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Server-side Supabase client for Server Components, Route Handlers, and
 * Server Actions. Cookie mutations are handled transparently by the middleware.
 *
 * Returns `null` when env vars are not configured so callers can degrade
 * gracefully instead of throwing (e.g. unauthenticated landing page in local dev).
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SERENE_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SERENE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  const cookieStore = cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Components cannot set cookies — the middleware handles refresh.
        }
      },
    },
  });
}
