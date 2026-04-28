// TODO: Replace with Anthropic API call when SERENE_ANTHROPIC_API_KEY is configured
// This route will:
//   1. Accept post content_type, caption, media_urls, and mood_tag
//   2. Use Claude claude-sonnet-4-20250514 with vision capability to analyse the actual image/video
//   3. Return a specific, warm companion message (≤3 sentences, never generic affirmations)
//   4. Detect mood from content if caption doesn't indicate one
//   System prompt: see .cursorrules §9 "Post companion system prompt"
//   max_tokens: 256 (post analysis, per bible §9)

import type { PostCompanionResponse } from "@/types/ai";

export async function POST(): Promise<Response> {
  const response: PostCompanionResponse = {
    message: "What a lovely moment to share.",
    mood_detected: null,
  };
  return Response.json(response);
}
