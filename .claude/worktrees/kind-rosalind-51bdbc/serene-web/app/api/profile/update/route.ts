import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateProfileSchema = z.object({
  display_name: z.string().min(2).max(50).optional(),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores.")
    .regex(/^[a-z]/, "Must start with a letter.")
    .optional(),
  bio: z.string().max(150).optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
});

export async function PATCH(request: Request) {
  const supabase = createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }
  const updates = parsed.data;

  // If username is changing, verify it's not taken by another user
  if (updates.username) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("username", updates.username)
      .neq("id", user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "That username is already taken." },
        { status: 409 }
      );
    }
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from("users")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    // Never return wellness_score or daily_session_minutes (§11)
    .select("id, username, display_name, avatar_url, bio, personality_type, created_at, updated_at")
    .single();

  if (updateError) {
    return NextResponse.json({ error: "Could not save changes." }, { status: 500 });
  }

  return NextResponse.json({ profile: updatedProfile });
}
