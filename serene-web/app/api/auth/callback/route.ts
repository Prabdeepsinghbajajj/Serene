import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// REMINDER: Ensure these are set in the Vercel dashboard before deploying:
//   NEXT_PUBLIC_SERENE_SUPABASE_URL
//   NEXT_PUBLIC_SERENE_SUPABASE_ANON_KEY
//   SERENE_SUPABASE_SERVICE_KEY
// Without them OAuth callback exchange will redirect to /login?error=not_configured.

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/feed";

  if (code) {
    const supabase = createClient();

    if (!supabase) {
      return NextResponse.redirect(`${origin}/login?error=not_configured`);
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();

        if (!profile?.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
