import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.SERENE_ANTHROPIC_API_KEY });

const POST_COMPANION_SYSTEM_PROMPT = `You are the Serene companion responding to a post a user just shared. Be specific about the actual content.
Never say generic things like "Great photo!" or "Love this!" or "Beautiful!".
Say something specific about what you see or feel in the content. Ask one gentle open-ended question if appropriate. Keep your response under 3 sentences.
Never suggest the user needs more followers or engagement. Respond in the same language as the caption.`;

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as {
    caption?: string;
    media_url?: string;
    content_type?: string;
    mood_tag?: string;
  };

  const { caption, media_url, content_type = "photo", mood_tag } = body;

  const messageContent: Anthropic.MessageParam["content"] = [];

  if (media_url && content_type === "photo") {
    messageContent.push({
      type: "image",
      source: { type: "url", url: media_url },
    });
  }

  messageContent.push({
    type: "text",
    text: caption
      ? `The user shared a ${content_type} with caption: "${caption}". Their mood: ${mood_tag}`
      : `The user shared a ${content_type} post with mood: ${mood_tag}. No caption.`,
  });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    system: POST_COMPANION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: messageContent }],
  });

  const message =
    response.content[0].type === "text"
      ? response.content[0].text
      : "What a lovely moment to share.";

  return Response.json({ message, mood_detected: mood_tag });
}
