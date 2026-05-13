import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  containsCrisisLanguage,
  CRISIS_RESOURCES,
} from "@/lib/ai/crisis-detection";
import type { Json } from "@/types/database";

const client = new Anthropic({ apiKey: process.env.SERENE_ANTHROPIC_API_KEY });

const RATE_LIMIT = 20; // messages per hour per user (bible §11)

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

  /* ---- Rate limit check (§11: max 20 companion messages per user per hour) */
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await supabase
    .from("wellness_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("event_type", "companion_message")
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= RATE_LIMIT) {
    return streamStaticText(
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

  /* ---- Stream response from Claude ---------------------------------------- */
  const trimmedMessages = messages
    .filter((m) => m.content && m.content.trim().length > 0)
    .slice(-10);

  const encoder = new TextEncoder();

  try {
    const stream = await client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: WELLNESS_SYSTEM_PROMPT,
      messages: trimmedMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }

          if (hasCrisis) {
            controller.enqueue(encoder.encode("\n\n---\n\n" + CRISIS_RESOURCES));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch {
    return streamStaticText(
      "I'm having a little trouble right now. Give me a moment and try again."
    );
  }
}

/** Used only for the rate-limit static message */
function streamStaticText(text: string): Response {
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
