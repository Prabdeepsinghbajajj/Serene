import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const clickSchema = z.object({
  impression_id: z.string().uuid(),
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

  const parsed = clickSchema.safeParse(
    await request.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid impression_id." }, { status: 400 });
  }

  await supabase
    .from("ad_impressions")
    .update({ clicked: true })
    .eq("id", parsed.data.impression_id)
    .eq("user_id", user.id); // ownership check

  return NextResponse.json({ success: true });
}
