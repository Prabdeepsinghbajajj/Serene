import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const dismissSchema = z.object({
  impression_id: z.string().uuid(),
  ad_id: z.string().uuid(),
  reason: z.enum(["not_for_me", "irrelevant", "offensive"]),
  ad_categories: z.array(z.string()),
});

export async function POST(request: Request) {
  const supabase = createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const parsed = dismissSchema.safeParse(
    await request.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { impression_id, reason, ad_categories } = parsed.data;

  /* Mark impression as dismissed */
  await supabase
    .from("ad_impressions")
    .update({ dismissed: true })
    .eq("id", impression_id)
    .eq("user_id", user.id); // ownership check

  /* "not_for_me" → permanently block these categories for this user (§10) */
  if (reason === "not_for_me" && ad_categories.length > 0) {
    const { data: profile } = await supabase
      .from("personality_profiles")
      .select("blocked_ad_categories")
      .eq("user_id", user.id)
      .single();

    const existing: string[] =
      (profile?.blocked_ad_categories as string[]) ?? [];
    const seen = new Set(existing);
    ad_categories.forEach((c) => seen.add(c));
    const updated = Array.from(seen);

    await supabase
      .from("personality_profiles")
      .update({ blocked_ad_categories: updated })
      .eq("user_id", user.id);
  }

  return NextResponse.json({ success: true });
}
