import { supabase } from './supabase'

/**
 * The @supabase/ssr server client reads auth from cookies. It stores the
 * session as raw JSON, URL-encoded by the cookie serialiser (cookie.serialize),
 * chunked if encodeURIComponent(json).length > 3180.
 *
 * We reconstruct those exact cookie(s) from the mobile session so Next.js
 * decodes them correctly and the SSR client can authenticate the request.
 */

const PROJECT_REF = 'fjfdundcziicyxbrsvgs'
const COOKIE_NAME = `sb-${PROJECT_REF}-auth-token`
const MAX_ENCODED_CHUNK = 3180

function buildAuthCookieHeader(sessionJson: string): string {
  let encodedValue = encodeURIComponent(sessionJson)

  if (encodedValue.length <= MAX_ENCODED_CHUNK) {
    // Single cookie — send URL-encoded; cookie.parse on server decodes it back
    return `${COOKIE_NAME}=${encodedValue}`
  }

  // Split into chunks matching @supabase/ssr createChunks logic
  const rawChunks: string[] = []
  while (encodedValue.length > 0) {
    let head = encodedValue.slice(0, MAX_ENCODED_CHUNK)
    // Don't split mid-escape-sequence (%XX)
    const lastEsc = head.lastIndexOf('%')
    if (lastEsc > MAX_ENCODED_CHUNK - 3) head = head.slice(0, lastEsc)
    rawChunks.push(decodeURIComponent(head))
    encodedValue = encodedValue.slice(head.length)
  }

  return rawChunks
    .map((chunk, i) => `${COOKIE_NAME}.${i}=${encodeURIComponent(chunk)}`)
    .join('; ')
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) throw new Error('Not authenticated')

  const cookieHeader = buildAuthCookieHeader(JSON.stringify(session))
  const url = `${process.env.EXPO_PUBLIC_API_URL}${path}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      Cookie: cookieHeader,
      ...((options?.headers ?? {}) as Record<string, string>),
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as Record<string, string>
    throw new Error(body.error ?? `HTTP ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function apiStream(path: string, body: unknown): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')
  const cookieHeader = buildAuthCookieHeader(JSON.stringify(session))
  const url = `${process.env.EXPO_PUBLIC_API_URL}${path}`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      Cookie: cookieHeader,
    },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({})) as Record<string, string>
    throw new Error(errBody.error ?? `HTTP ${response.status}`)
  }
  return response
}
