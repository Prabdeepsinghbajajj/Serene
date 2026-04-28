"use client";

import { motion } from "framer-motion";
import type { CompanionMessage as CompanionMessageType } from "@/types/ai";

/* -------------------------------------------------------------------------- */
/*  Pulsing typing indicator — shown while assistant message content is empty  */
/* -------------------------------------------------------------------------- */
function TypingDots() {
  return (
    <span className="flex items-center gap-1 h-5 px-1" aria-label="Companion is responding">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-sage-400 animate-pulse"
          style={{ animationDelay: `${i * 0.15}s` }}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* -------------------------------------------------------------------------- */
/*  CompanionMessage                                                            */
/* -------------------------------------------------------------------------- */
interface Props {
  message: CompanionMessageType;
  isStreaming?: boolean;
}

export function CompanionMessage({ message, isStreaming = false }: Props) {
  const isUser = message.role === "user";
  const isEmpty = !message.content && !isUser;

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-xs sm:max-w-sm">
          <div className="rounded-2xl rounded-tr-sm bg-cream-200 px-4 py-3">
            <p className="font-sans text-base text-slate-warm leading-[1.7] whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
          <p className="font-sans text-xs text-slate-hint mt-1 text-right">
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
    );
  }

  // Assistant message — animate in
  return (
    <motion.div
      className="flex justify-start"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="max-w-xs sm:max-w-sm">
        <div className="rounded-2xl rounded-tl-sm bg-sage-100 px-4 py-3">
          {isEmpty && isStreaming ? (
            <TypingDots />
          ) : (
            <p className="font-serif italic text-base text-slate-warm leading-[1.7] whitespace-pre-wrap">
              {message.content}
            </p>
          )}
        </div>
        {!isEmpty && (
          <p className="font-sans text-xs text-slate-hint mt-1">
            {formatTime(message.timestamp)}
          </p>
        )}
      </div>
    </motion.div>
  );
}
