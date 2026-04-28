import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  containsCrisisLanguage,
  buildCrisisResponse,
} from "@/lib/ai/crisis-detection";
import type { Json } from "@/types/database";

const RATE_LIMIT = 20; // messages per hour per user (bible §11)

/* -------------------------------------------------------------------------- */
/*  Placeholder responses — warm, grounding, brief (§9 system prompt style)   */
/*  TODO: Replace with Anthropic API streaming call when                       */
/*        SERENE_ANTHROPIC_API_KEY is configured                               */
/* -------------------------------------------------------------------------- */
const PLACEHOLDER_RESPONSES = [
  "That sounds like it matters to you. What feels most present about it right now?",
  "I hear you. Sometimes just putting it into words is its own kind of relief.",
  "Thank you for sharing that. What would feel like a small step forward today?",
  "That makes sense. How are you feeling in your body right now — is there any tension you notice?",
  "It sounds like there's a lot going on. What's one thing that felt okay today, even briefly?",
  "I'm here. Take your time — there's no rush in this space.",
  "That's worth sitting with. What do you think you need most right now?",
  "Sometimes things feel heavier than they are, and sometimes exactly as heavy. How does this feel to you?",
];

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

  /* ---- Rate limit check (§11: max 20 companion messages per user per hour) */
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await supabase
    .from("wellness_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("event_type", "companion_message")
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= RATE_LIMIT) {
    return streamText(
      "Take a moment away — come back soon. I'll be here."
    );
  }

  /* ---- Log companion interaction (§11: never logs message content) -------- */
  await supabase.from("wellness_events").insert({
    user_id: user.id,
    event_type: "companion_message",
    metadata: { message_count: messages.length } as unknown as Json,
  });

  /* ---- Crisis detection (§9: always provide resources immediately) -------- */
  const hasCrisis = containsCrisisLanguage(lastUserMessage);

  /*
   * TODO: Replace this entire block with:
   *
   *   import Anthropic from '@anthropic-ai/sdk'
   *   const client = new Anthropic({ apiKey: process.env.SERENE_ANTHROPIC_API_KEY })
   *   const stream = await client.messages.stream({
   *     model: 'claude-sonnet-4-20250514',
   *     max_tokens: 1024,
   *     system: WELLNESS_SYSTEM_PROMPT,
   *     messages: messages.map(m => ({ role: m.role as 'user'|'assistant', content: m.content })),
   *   })
   *   const finalResponse = hasCrisis
   *     ? buildCrisisResponse(await stream.finalText())
   *     : await stream.finalText()
   *   return new Response(stream.toReadableStream(), { headers: ... })
   *
   * When SERENE_ANTHROPIC_API_KEY is configured
   */
  const baseResponse =
    PLACEHOLDER_RESPONSES[
      Math.floor(Math.random() * PLACEHOLDER_RESPONSES.length)
    ];
  const finalResponse = hasCrisis
    ? buildCrisisResponse(baseResponse)
    : baseResponse;

  return streamText(finalResponse);
}

/* Simulate streaming word-by-word so the client streaming code is exercised */
function streamText(text: string): Response {
  const encoder = new TextEncoder();
  const words = text.split(" ");

  const stream = new ReadableStream({
    async start(controller) {
      for (const word of words) {
        controller.enqueue(encoder.encode(word + " "));
        await new Promise<void>((resolve) => setTimeout(resolve, 30));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
