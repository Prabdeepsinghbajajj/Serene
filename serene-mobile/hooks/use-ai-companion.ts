import { useState, useCallback, useRef, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiStream } from '@/lib/api'
import { containsCrisisLanguage } from '@/types/ai'
import type { CompanionMessage } from '@/types/ai'

const STORAGE_KEY = 'serene_companion_messages'

async function loadMessages(): Promise<CompanionMessage[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored) as CompanionMessage[]
    return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }))
  } catch {
    return []
  }
}

async function saveMessages(messages: CompanionMessage[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } catch {
    // ignore quota errors
  }
}

export function useAICompanion() {
  const [messages, setMessages] = useState<CompanionMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCrisisCard, setShowCrisisCard] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    loadMessages().then((stored) => {
      if (stored.length > 0) setMessages(stored)
    })
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return
      setError(null)

      if (containsCrisisLanguage(content)) {
        setShowCrisisCard(true)
      }

      const userMessage: CompanionMessage = {
        id: Math.random().toString(36).slice(2),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      }

      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)
      await saveMessages(updatedMessages)

      const assistantMessage: CompanionMessage = {
        id: Math.random().toString(36).slice(2),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }
      const withAssistant = [...updatedMessages, assistantMessage]
      setMessages(withAssistant)

      setIsStreaming(true)
      abortRef.current = new AbortController()

      try {
        const response = await apiStream('/api/ai/wellness-chat', {
          method: 'POST',
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            lastUserMessage: content,
          }),
          signal: abortRef.current.signal,
        })

        if (!response.body) throw new Error('No response body.')

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
          setMessages((prev) => {
            const updated = [...prev]
            const lastIdx = updated.length - 1
            updated[lastIdx] = { ...updated[lastIdx], content: accumulated }
            return updated
          })
        }

        setMessages((prev) => {
          saveMessages(prev)
          return prev
        })
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setError('Something went wrong. Please try again.')
        setMessages((prev) => {
          const cleaned = prev.filter((m) => m.id !== assistantMessage.id)
          saveMessages(cleaned)
          return cleaned
        })
      } finally {
        setIsStreaming(false)
      }
    },
    [messages, isStreaming]
  )

  const clearMessages = useCallback(async () => {
    setMessages([])
    setShowCrisisCard(false)
    await AsyncStorage.removeItem(STORAGE_KEY)
  }, [])

  return { messages, isStreaming, error, showCrisisCard, sendMessage, clearMessages }
}
