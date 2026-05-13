"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/auth/validation";

export const dynamic = "force-dynamic";

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#F5F0E8",
  borderRadius: "0.75rem",
  padding: "0.75rem 1rem",
  width: "100%",
  fontSize: "1rem",
  lineHeight: "1.7",
  outline: "none",
  fontFamily: "var(--font-dm-sans)",
};

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setServerError("We couldn't send the reset link. Please try again.");
      return;
    }
    setSent(true);
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 py-16"
      style={{ background: "#1A1A18" }}
    >
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="blob"
          style={{
            width: 400,
            height: 400,
            background: "rgba(78,122,68,0.10)",
            top: "-10%",
            right: "-5%",
            animationDuration: "18s",
          }}
        />
        <div
          className="blob"
          style={{
            width: 300,
            height: 300,
            background: "rgba(212,136,58,0.06)",
            bottom: "5%",
            left: "-5%",
            animationDuration: "22s",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="font-display text-3xl text-grad-sage">Serene</span>
        </div>

        <div
          className="rounded-2xl p-8 space-y-6"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="space-y-1">
            <h1
              className="font-display text-2xl font-[300]"
              style={{ color: "#F5F0E8" }}
            >
              Reset your password
            </h1>
            <p
              className="font-sans text-sm"
              style={{ color: "rgba(245,240,232,0.40)" }}
            >
              Enter your email and we&apos;ll send you a recovery link.
            </p>
          </div>

          {sent ? (
            <div
              className="rounded-xl p-4"
              style={{
                background: "rgba(78,122,68,0.12)",
                border: "1px solid rgba(78,122,68,0.2)",
              }}
            >
              <p
                className="font-sans text-sm leading-[1.7]"
                style={{ color: "rgba(138,189,128,0.9)" }}
              >
                Reset link sent. Check your inbox and open the link on this
                device.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="font-sans text-xs uppercase tracking-wider"
                  style={{ color: "rgba(245,240,232,0.50)" }}
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                  style={inputStyle}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              {serverError && <p className="text-sm text-destructive">{serverError}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl font-sans text-sm font-[500] transition-all duration-200 hover:-translate-y-px disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #5E9A52, #3A6032)",
                  color: "#F5F0E8",
                  boxShadow: "0 4px 20px rgba(78,122,68,0.3)",
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </span>
                ) : (
                  "Send reset link"
                )}
              </button>
            </form>
          )}

          <p
            className="text-center font-sans text-sm"
            style={{ color: "rgba(245,240,232,0.40)" }}
          >
            Remembered your password?{" "}
            <Link
              href="/login"
              className="text-sage-300 hover:text-sage-100 transition-colors"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
