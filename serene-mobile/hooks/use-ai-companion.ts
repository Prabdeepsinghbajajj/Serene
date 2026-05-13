import { useState, useCallback, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiFetch } from '@/lib/api'
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

  useEffect(() => {
    loadMessages().then((stored) => {
      if (stored.length > 0) setMessages(stored)
    })
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return
      setError(null)

      if (containsCrisisLanguage(content)) setShowCrisisCard(true)

      const userMsg: CompanionMessage = {
        id: Math.random().toString(36).slice(2),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      }
      const assistantMsg: CompanionMessage = {
        id: Math.random().toString(36).slice(2),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }

      const withUser = [...messages, userMsg]
      setMessages([...withUser, assistantMsg])
      await saveMessages(withUser)

      setIsStreaming(true)

      try {
        const data = await apiFetch<{ message: string }>(
          '/api/ai/wellness-chat-mobile',
          {
            method: 'POST',
            body: JSON.stringify({
              messages: withUser
                .map((m) => ({ role: m.role, content: m.content }))
                .filter((m) => m.content.trim().length > 0)
                .slice(-10),
              lastUserMessage: content,
            }),
          }
        )

        const fullText = data.message
        if (!fullText) throw new Error('Empty response from companion.')

        const finalMessages: CompanionMessage[] = [
          ...withUser,
          { ...assistantMsg, content: fullText },
        ]
        setMessages(finalMessages)
        await saveMessages(finalMessages)
      } catch (err) {
        console.error('Companion error:', err)
        setMessages(withUser)
        await saveMessages(withUser)
        setError('Something went wrong. Please try again.')
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
