"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
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

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setHasRecoverySession(Boolean(data.session));
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY") {
        setHasRecoverySession(true);
        return;
      }
      setHasRecoverySession(Boolean(session));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  async function onSubmit(values: ResetPasswordInput) {
    setServerError(null);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setServerError("Could not update password. Please retry from the email link.");
      return;
    }
    await supabase.auth.signOut();
    setSaved(true);
    setHasRecoverySession(false);
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
              Choose a new password
            </h1>
            <p
              className="font-sans text-sm"
              style={{ color: "rgba(245,240,232,0.40)" }}
            >
              Use at least 8 characters with one uppercase letter and one number.
            </p>
          </div>

          {!ready ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-sage-300" />
            </div>
          ) : saved ? (
            <div
              className="rounded-xl p-4 space-y-3"
              style={{
                background: "rgba(78,122,68,0.12)",
                border: "1px solid rgba(78,122,68,0.2)",
              }}
            >
              <p
                className="font-sans text-sm leading-[1.7]"
                style={{ color: "rgba(138,189,128,0.9)" }}
              >
                Password updated successfully.
              </p>
              <Link
                href="/login"
                className="inline-block font-sans text-sm text-sage-300 hover:text-sage-100 transition-colors"
              >
                Continue to sign in
              </Link>
            </div>
          ) : !hasRecoverySession ? (
            <div
              className="rounded-xl p-4 space-y-2"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p className="font-sans text-sm" style={{ color: "rgba(245,240,232,0.6)" }}>
                This page needs a valid recovery link.
              </p>
              <Link
                href="/forgot-password"
                className="font-sans text-sm text-sage-300 hover:text-sage-100 transition-colors"
              >
                Request a new reset email
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="font-sans text-xs uppercase tracking-wider"
                  style={{ color: "rgba(245,240,232,0.50)" }}
                >
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="New password"
                  aria-invalid={!!errors.password}
                  style={inputStyle}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="font-sans text-xs uppercase tracking-wider"
                  style={{ color: "rgba(245,240,232,0.50)" }}
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  aria-invalid={!!errors.confirmPassword}
                  style={inputStyle}
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
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
                    Saving…
                  </span>
                ) : (
                  "Update password"
                )}
              </button>
            </form>
          )}

          <p
            className="text-center font-sans text-sm"
            style={{ color: "rgba(245,240,232,0.40)" }}
          >
            Need to start over?{" "}
            <Link
              href="/forgot-password"
              className="text-sage-300 hover:text-sage-100 transition-colors"
            >
              Send another link
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
