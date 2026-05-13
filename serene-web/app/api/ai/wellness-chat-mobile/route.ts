import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  containsCrisisLanguage,
  buildCrisisResponse,
} from "@/lib/ai/crisis-detection";
import type { Json } from "@/types/database";

const client = new Anthropic({ apiKey: process.env.SERENE_ANTHROPIC_API_KEY });

const RATE_LIMIT = 20;

const WELLNESS_SYSTEM_PROMPT = `You are the Serene companion — a warm, grounding presence for this user.
Be a genuine friend who listens without judgment.
Validate feelings briefly, then gently redirect toward something grounding.
Actively encourage rest, movement, and going outside.
Keep responses 2-4 sentences.
Never ask multiple questions at once.
Never suggest posting more or growing their audience.
Never provide clinical diagnosis or therapy.
If the user expresses crisis-level distress, always append crisis resources immediately.
You want the user to feel better — ideally by stepping away from the screen.`;

export async function POST(request: Request) {
  const supabase = createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as {
    messages?: { role: string; content: string }[];
    lastUserMessage?: string;
  };
  const { messages = [], lastUserMessage = "" } = body;

  if (!lastUserMessage.trim()) {
    return NextResponse.json({ error: "Message required." }, { status: 400 });
  }

  /* ---- Rate limit (§11: max 20 companion messages per user per hour) -------- */
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await supabase
    .from("wellness_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("event_type", "companion_message")
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= RATE_LIMIT) {
    return NextResponse.json({
      message: "Take a moment away — come back soon. I'll be here.",
    });
  }

  /* ---- Log event (§11: never logs message content) ------------------------- */
  await supabase.from("wellness_events").insert({
    user_id: user.id,
    event_type: "companion_message",
    metadata: { message_count: messages.length, source: "mobile" } as unknown as Json,
  });

  /* ---- Crisis detection (§9) ----------------------------------------------- */
  const hasCrisis = containsCrisisLanguage(lastUserMessage);

  /* ---- Call Claude (non-streaming for React Native compatibility) ----------- */
  const trimmedMessages = messages
    .filter((m) => m.content?.trim().length > 0)
    .slice(-10);

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: WELLNESS_SYSTEM_PROMPT,
      messages: trimmedMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const text =
      response.content[0].type === "text"
        ? response.content[0].text
        : "I'm here with you.";

    return NextResponse.json({
      message: hasCrisis ? buildCrisisResponse(text) : text,
    });
  } catch (error) {
    console.error("Companion mobile error:", error);
    return NextResponse.json({
      message: "I'm having a little trouble right now. Give me a moment and try again.",
    });
  }
}
