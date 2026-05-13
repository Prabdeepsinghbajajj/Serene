/* -------------------------------------------------------------------------- */
/*  Crisis language detection (§9: if user expresses crisis-level distress,   */
/*  always provide crisis resources immediately)                               */
/* -------------------------------------------------------------------------- */

const CRISIS_KEYWORDS: string[] = [
  "suicide",
  "kill myself",
  "end it all",
  "hurt myself",
  "self harm",
  "self-harm",
  "don't want to be here",
  "want to die",
  "no reason to live",
  "harm myself",
];

export function containsCrisisLanguage(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((keyword) => lower.includes(keyword));
}

export const CRISIS_RESOURCES = `If things feel overwhelming right now, please know you don't have to carry this alone.

• Crisis Text Line: Text HOME to 741741
• International helplines: iasp.info/resources/Crisis_Centres
• Emergency services: Call your local emergency number

You deserve support from people who are trained to help.`;

export function buildCrisisResponse(originalResponse: string): string {
  return `${originalResponse}\n\n---\n\n${CRISIS_RESOURCES}`;
}
