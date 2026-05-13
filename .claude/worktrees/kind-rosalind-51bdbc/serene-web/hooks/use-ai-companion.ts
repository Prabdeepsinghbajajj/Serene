"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { CompanionMessage } from "@/types/ai";
import { containsCrisisLanguage } from "@/lib/ai/crisis-detection";

const SESSION_STORAGE_KEY = "serene_companion_messages";

function loadMessages(): CompanionMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as CompanionMessage[];
    // Rehydrate Date objects (JSON.parse gives strings)
    return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [];
  }
}

function saveMessages(messages: CompanionMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // Ignore quota errors silently
  }
}

export function useAICompanion() {
  // Always start with [] so server and client render identically during hydration.
  // We load from sessionStorage in a useEffect — only runs client-side after mount.
  const [messages, setMessages] = useState<CompanionMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCrisisCard, setShowCrisisCard] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Rehydrate from sessionStorage after hydration completes
  useEffect(() => {
    const stored = loadMessages();
    if (stored.length > 0) {
      setMessages(stored);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      setError(null);

      // Detect crisis before sending (§9: show resources immediately)
      if (containsCrisisLanguage(content)) {
        setShowCrisisCard(true);
      }

      const userMessage: CompanionMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      saveMessages(updatedMessages);

      // Placeholder assistant bubble — will be filled by streaming
      const assistantMessage: CompanionMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      const withAssistant = [...updatedMessages, assistantMessage];
      setMessages(withAssistant);

      setIsStreaming(true);
      abortRef.current = new AbortController();

      try {
        const response = await fetch("/api/ai/wellness-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            lastUserMessage: content,
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) throw new Error("Failed to get response.");
        if (!response.body) throw new Error("No response body.");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });

          // Update the last (assistant) message in real time
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            updated[lastIdx] = { ...updated[lastIdx], content: accumulated };
            return updated;
          });
        }

        // Persist final state
        setMessages((prev) => {
          saveMessages(prev);
          return prev;
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError("Something went wrong. Please try again.");
        // Remove the empty assistant bubble on error
        setMessages((prev) => {
          const cleaned = prev.filter((m) => m.id !== assistantMessage.id);
          saveMessages(cleaned);
          return cleaned;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setShowCrisisCard(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  return {
    messages,
    isStreaming,
    error,
    showCrisisCard,
    sendMessage,
    clearMessages,
  };
}
