"use client";

export const dynamic = "force-dynamic";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAICompanion } from "@/hooks/use-ai-companion";
import { CompanionMessage } from "@/components/companion/companion-message";
import { CrisisCard } from "@/components/companion/crisis-card";

/* -------------------------------------------------------------------------- */
/*  Leaf SVG for empty state                                                   */
/* -------------------------------------------------------------------------- */
function LeafIllustration() {
  return (
    <svg
      width="60"
      height="60"
      viewBox="0 0 60 60"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M30 54C18 54 8 44 8 30C8 16 18 6 30 6C42 6 52 16 52 30C52 44 42 54 30 54Z"
        fill="#C9DBC2"
        opacity="0.5"
      />
      <path
        d="M30 52C30 52 30 20 30 8"
        stroke="#87AA7E"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Inline send leaf icon                                                       */
/* -------------------------------------------------------------------------- */
function SendLeafIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 21C8 21 4 17 4 12C4 7 8 3 12 3C16 3 20 7 20 12C20 17 16 21 12 21Z"
        stroke={active ? "#87AA7E" : "#ADADAA"}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill={active ? "#E8EFE4" : "none"}
      />
      <path
        d="M12 20V10"
        stroke={active ? "#4E7A44" : "#ADADAA"}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Companion page                                                              */
/* -------------------------------------------------------------------------- */
export default function CompanionPage() {
  const { messages, isStreaming, error, showCrisisCard, sendMessage, clearMessages } =
    useAICompanion();

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Auto-scroll to bottom when messages change */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isStreaming]);

  /* Auto-grow textarea */
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const el = e.target;
    setInputValue(el.value);
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isStreaming) return;
    const toSend = inputValue;
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    sendMessage(toSend);
  }, [inputValue, isStreaming, sendMessage]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleClear() {
    if (
      window.confirm(
        "Clear this conversation? This cannot be undone."
      )
    ) {
      clearMessages();
    }
  }

  const canSend = inputValue.trim().length > 0 && !isStreaming;
  const charCount = inputValue.length;

  /* Determine where the crisis card goes — after the first user message
     that triggered it (splice it in at the right index) */
  const crisisTriggerIdx = showCrisisCard
    ? messages.findIndex(
        (m) => m.role === "user"
      )
    : -1;

  return (
    <div
      className="flex flex-col bg-[#1A1A18]"
      style={{ minHeight: "calc(100vh - 3.5rem)" }}
    >
      <div className="flex flex-col flex-1 max-w-xl mx-auto w-full">
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-start justify-between px-4 pt-6 pb-4"
          style={{
            background: "rgba(26,26,24,0.90)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div>
            <h1 className="font-display text-xl font-[400] text-grad-sage">
              Your companion
            </h1>
            <p className="font-sans text-sm mt-0.5" style={{ color: "rgba(245,240,232,0.35)" }}>
              A quiet space to check in
            </p>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="font-sans text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300 rounded mt-1"
              style={{ color: "rgba(245,240,232,0.25)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(245,240,232,0.45)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(245,240,232,0.25)"; }}
            >
              Clear conversation
            </button>
          )}
        </div>

        {/* Messages area */}
        <div
          className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
          aria-live="polite"
          aria-label="Conversation"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] space-y-4 text-center">
              <LeafIllustration />
              <p className="font-display italic text-xl" style={{ color: "rgba(245,240,232,0.5)" }}>
                How are you today?
              </p>
              <p className="font-sans text-base max-w-xs leading-[1.7]" style={{ color: "rgba(245,240,232,0.3)" }}>
                This is your space. No judgement, no metrics.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={msg.id}>
              <CompanionMessage
                message={msg}
                isStreaming={
                  isStreaming && idx === messages.length - 1 && msg.role === "assistant"
                }
              />
              {showCrisisCard && idx === crisisTriggerIdx && (
                <div className="mt-2">
                  <CrisisCard />
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          className="sticky bottom-0 px-4 py-4 space-y-2"
          style={{
            background: "#222220",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {charCount > 400 && (
            <p className="font-sans text-xs text-right" style={{ color: "rgba(245,240,232,0.25)" }}>
              {charCount}/500
            </p>
          )}

          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="What's on your mind..."
              maxLength={500}
              rows={1}
              disabled={isStreaming}
              aria-label="Message input"
              className="flex-1 resize-none rounded-xl px-4 py-3 font-sans text-base leading-[1.7] border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300 disabled:opacity-50"
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "#F5F0E8",
                maxHeight: "120px",
                overflowY: "auto",
              }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              aria-label="Send message"
              className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300 disabled:cursor-not-allowed"
            >
              <SendLeafIcon active={canSend} />
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                className="font-sans text-sm"
                style={{ color: "#F2A65A" }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
