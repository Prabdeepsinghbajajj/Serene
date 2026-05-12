export interface CompanionMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const CRISIS_KEYWORDS = [
  'suicide',
  'kill myself',
  'end it all',
  'hurt myself',
  'self harm',
  'self-harm',
  "don't want to be here",
  'want to die',
  'no reason to live',
  'harm myself',
]

export function containsCrisisLanguage(text: string): boolean {
  const lower = text.toLowerCase()
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw))
}

export const CRISIS_RESOURCES =
  "If things feel overwhelming right now, please know you don't have to carry this alone.\n\n" +
  '• Crisis Text Line: Text HOME to 741741\n' +
  '• International helplines: iasp.info/resources/Crisis_Centres\n' +
  '• Emergency services: Call your local emergency number\n\n' +
  'You deserve support from people who are trained to help.'
