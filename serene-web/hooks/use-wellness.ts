"use client";

// Re-export hook from context file for import path consistency (bible §3 / §5).
// Consumers can import from either '@/context/wellness-context' or '@/hooks/use-wellness'.
export { useWellness } from "@/context/wellness-context";
