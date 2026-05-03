"use client";

import { useState, useEffect, useCallback } from "react";

export const dynamic = "force-dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, Check } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { signUpSchema, type SignUpInput } from "@/lib/auth/validation";
import { Button } from "@/components/ui/button";

/* -------------------------------------------------------------------------- */
/*  Password strength                                                           */
/* -------------------------------------------------------------------------- */
function passwordStrength(password: string): 0 | 1 | 2 | 3 {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  else if (/[0-9]/.test(password)) score = Math.max(score, 1);
  return Math.min(score, 3) as 0 | 1 | 2 | 3;
}

const strengthColors: Record<1 | 2 | 3, [string, string, string]> = {
  1: ["rgba(242,166,90,0.8)", "rgba(255,255,255,0.1)", "rgba(255,255,255,0.1)"],
  2: ["rgba(74,138,181,0.8)", "rgba(74,138,181,0.8)", "rgba(255,255,255,0.1)"],
  3: ["#8ABD80", "#8ABD80", "#8ABD80"],
};
const strengthLabel: Record<1 | 2 | 3, string> = { 1: "Weak", 2: "Good", 3: "Strong" };

/* -------------------------------------------------------------------------- */
/*  Username availability                                                       */
/* -------------------------------------------------------------------------- */
type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

function useUsernameCheck(username: string): UsernameStatus {
  const [status, setStatus] = useState<UsernameStatus>("idle");
  const supabase = createClient();
  const check = useCallback(async (value: string) => {
    if (value.length < 3) { setStatus("idle"); return; }
    if (!/^[a-z][a-z0-9_]{2,19}$/.test(value)) { setStatus("invalid"); return; }
    setStatus("checking");
    const { data } = await supabase.from("users").select("id").eq("username", value).maybeSingle();
    setStatus(data ? "taken" : "available");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    setStatus("idle");
    const t = setTimeout(() => { if (username) check(username); }, 600);
    return () => clearTimeout(t);
  }, [username, check]);
  return status;
}

/* -------------------------------------------------------------------------- */
/*  Shared input style                                                          */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/*  Page                                                                        */
/* -------------------------------------------------------------------------- */
export default function SignupPage() {
  const supabase = createClient();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  });

  const passwordValue = watch("password", "");
  const usernameValue = watch("username", "");
  const strength = passwordStrength(passwordValue) as 0 | 1 | 2 | 3;
  const usernameStatus = useUsernameCheck(usernameValue);

  async function onSubmit(values: SignUpInput) {
    setServerError(null);
    const { data: existing } = await supabase.from("users").select("id").eq("username", values.username).maybeSingle();
    if (existing) { setServerError("That username was just taken. Please choose another."); return; }
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { username: values.username, display_name: values.display_name } },
    });
    if (error) { setServerError("Something went wrong. Please try again."); return; }
    setConfirmed(true);
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  }

  if (confirmed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-16" style={{ background: "#1A1A18" }}>
        <div className="w-full max-w-sm">
          <div className="rounded-2xl p-8 space-y-4" style={{ background: "rgba(78,122,68,0.12)", border: "1px solid rgba(78,122,68,0.2)" }}>
            <h2 className="font-display text-xl font-[300]" style={{ color: "#F5F0E8" }}>Check your email</h2>
            <p className="font-sans text-base leading-[1.7]" style={{ color: "rgba(245,240,232,0.60)" }}>
              We sent you a confirmation link. Click it to activate your account and start your journey on Serene.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16" style={{ background: "#1A1A18" }}>
      {/* Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="blob" style={{ width: 400, height: 400, background: "rgba(78,122,68,0.10)", top: "-10%", right: "-5%", animationDuration: "18s" }} />
        <div className="blob" style={{ width: 300, height: 300, background: "rgba(212,136,58,0.06)", bottom: "5%", left: "-5%", animationDuration: "22s" }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="font-display text-3xl text-grad-sage">Serene</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 space-y-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-[300]" style={{ color: "#F5F0E8" }}>Join Serene</h1>
            <p className="font-sans text-sm" style={{ color: "rgba(245,240,232,0.40)" }}>Share what matters. Rest when you need to.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Display name */}
            <div className="space-y-1.5">
              <label htmlFor="display_name" className="font-sans text-xs uppercase tracking-wider" style={{ color: "rgba(245,240,232,0.50)" }}>
                Display name
              </label>
              <input id="display_name" type="text" autoComplete="name" placeholder="How you'll appear to others"
                aria-invalid={!!errors.display_name} style={inputStyle} {...register("display_name")} />
              {errors.display_name && <p className="text-sm text-destructive">{errors.display_name.message}</p>}
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="font-sans text-xs uppercase tracking-wider" style={{ color: "rgba(245,240,232,0.50)" }}>
                Username
              </label>
              <div className="relative">
                <input id="username" type="text" autoComplete="username" autoCapitalize="none"
                  placeholder="lowercase_only" aria-invalid={!!errors.username || usernameStatus === "taken"}
                  style={inputStyle} {...register("username")} />
                {usernameStatus === "checking" && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" style={{ color: "rgba(245,240,232,0.30)" }} />
                )}
                {usernameStatus === "available" && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sage-300" />
                )}
              </div>
              {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
              {!errors.username && usernameStatus === "taken" && <p className="text-sm text-destructive">This username is taken.</p>}
              {!errors.username && usernameStatus === "available" && <p className="text-sm text-sage-300">Username is available.</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="font-sans text-xs uppercase tracking-wider" style={{ color: "rgba(245,240,232,0.50)" }}>
                Email
              </label>
              <input id="email" type="email" autoComplete="email" placeholder="you@example.com"
                aria-invalid={!!errors.email} style={inputStyle} {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="font-sans text-xs uppercase tracking-wider" style={{ color: "rgba(245,240,232,0.50)" }}>
                Password
              </label>
              <input id="password" type="password" autoComplete="new-password"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                aria-invalid={!!errors.password} style={inputStyle} {...register("password")} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              {passwordValue && strength > 0 && (
                <div className="flex gap-1 pt-1" role="img" aria-label={`Password strength: ${strengthLabel[strength as 1 | 2 | 3]}`}>
                  {strengthColors[strength as 1 | 2 | 3].map((color, i) => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-colors duration-300" style={{ background: color }} />
                  ))}
                </div>
              )}
            </div>

            {serverError && <p className="text-sm text-destructive">{serverError}</p>}

            <button
              type="submit"
              disabled={isSubmitting || usernameStatus === "taken"}
              className="w-full py-3.5 rounded-xl font-sans text-sm font-[500] transition-all duration-200 hover:-translate-y-px disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #5E9A52, #3A6032)", color: "#F5F0E8", boxShadow: "0 4px 20px rgba(78,122,68,0.3)" }}
            >
              {isSubmitting ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Creating account…</span> : "Create account"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 font-sans text-sm" style={{ background: "rgba(26,26,24,0.6)", color: "rgba(245,240,232,0.25)" }}>or</span>
            </div>
          </div>

          <Button variant="outline" className="w-full border-0"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(245,240,232,0.70)" }}
            size="lg" onClick={handleGoogleSignIn} disabled={googleLoading} type="button">
            {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Continue with Google
          </Button>

          <p className="text-center font-sans text-sm" style={{ color: "rgba(245,240,232,0.40)" }}>
            Already have an account?{" "}
            <Link href="/login" className="text-sage-300 hover:text-sage-100 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
