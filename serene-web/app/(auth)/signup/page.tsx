"use client";

import { useState, useEffect, useCallback } from "react";

// Auth pages are always dynamic — depends on session and OAuth redirects
export const dynamic = "force-dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, Check } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { signUpSchema, type SignUpInput } from "@/lib/auth/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heading, Body } from "@/components/ui/typography";

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

const strengthConfig: Record<
  1 | 2 | 3,
  { label: string; colors: [string, string, string] }
> = {
  1: {
    label: "Weak",
    colors: ["bg-amber-glow", "bg-cream-200", "bg-cream-200"],
  },
  2: {
    label: "Good",
    colors: ["bg-sky-mid", "bg-sky-mid", "bg-cream-200"],
  },
  3: {
    label: "Strong",
    colors: ["bg-sage-400", "bg-sage-400", "bg-sage-400"],
  },
};

/* -------------------------------------------------------------------------- */
/*  Username availability indicator                                            */
/* -------------------------------------------------------------------------- */
type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

function useUsernameCheck(username: string): UsernameStatus {
  const [status, setStatus] = useState<UsernameStatus>("idle");
  const supabase = createClient();

  const check = useCallback(
    async (value: string) => {
      if (value.length < 3) {
        setStatus("idle");
        return;
      }
      if (!/^[a-z][a-z0-9_]{2,19}$/.test(value)) {
        setStatus("invalid");
        return;
      }
      setStatus("checking");
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("username", value)
        .maybeSingle();
      setStatus(data ? "taken" : "available");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    setStatus("idle");
    const t = setTimeout(() => {
      if (username) check(username);
    }, 600);
    return () => clearTimeout(t);
  }, [username, check]);

  return status;
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                        */
/* -------------------------------------------------------------------------- */
export default function SignupPage() {
  const supabase = createClient();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  });

  const passwordValue = watch("password", "");
  const usernameValue = watch("username", "");
  const strength = passwordStrength(passwordValue) as 0 | 1 | 2 | 3;
  const usernameStatus = useUsernameCheck(usernameValue);

  async function onSubmit(values: SignUpInput) {
    setServerError(null);

    /* Final username availability check before submitting */
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("username", values.username)
      .maybeSingle();

    if (existing) {
      setServerError("That username was just taken. Please choose another.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          username: values.username,
          display_name: values.display_name,
        },
      },
    });

    if (error) {
      setServerError("Something went wrong. Please try again.");
      return;
    }

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
      <main className="min-h-screen bg-cream-50 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-sm">
          <div className="bg-sage-100 rounded-lg p-8 space-y-4">
            <Heading as="h2" size="md">
              Check your email
            </Heading>
            <Body muted>
              We sent you a confirmation link. Click it to activate your account
              and start your journey on Serene.
            </Body>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream-50 flex items-center justify-center px-8 py-16">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-10 space-y-2">
          <Heading as="h1" size="lg">
            Join Serene
          </Heading>
          <Body muted>Share what matters. Rest when you need to.</Body>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Display name */}
          <div className="space-y-1.5">
            <label
              htmlFor="display_name"
              className="font-sans text-sm text-slate-warm"
            >
              Display name
            </label>
            <Input
              id="display_name"
              type="text"
              autoComplete="name"
              placeholder="How you'll appear to others"
              aria-invalid={!!errors.display_name}
              {...register("display_name")}
            />
            {errors.display_name && (
              <p className="text-sm text-destructive">
                {errors.display_name.message}
              </p>
            )}
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="font-sans text-sm text-slate-warm"
            >
              Username
            </label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                placeholder="lowercase_only"
                aria-invalid={!!errors.username || usernameStatus === "taken"}
                {...register("username")}
              />
              {/* Status indicator */}
              {usernameStatus === "checking" && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-hint" />
              )}
              {usernameStatus === "available" && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sage-600" />
              )}
            </div>
            {errors.username && (
              <p className="text-sm text-destructive">
                {errors.username.message}
              </p>
            )}
            {!errors.username && usernameStatus === "taken" && (
              <p className="text-sm text-destructive">
                This username is taken.
              </p>
            )}
            {!errors.username && usernameStatus === "available" && (
              <p className="text-sm text-sage-600">Username is available.</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="font-sans text-sm text-slate-warm"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password + strength meter */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="font-sans text-sm text-slate-warm"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
            {/* Strength bar — 3 segments, no numbers */}
            {passwordValue && strength > 0 && (
              <div
                className="flex gap-1 pt-1"
                role="img"
                aria-label={`Password strength: ${strengthConfig[strength as 1 | 2 | 3].label}`}
              >
                {strengthConfig[strength as 1 | 2 | 3].colors.map(
                  (color, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${color}`}
                    />
                  )
                )}
              </div>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting || usernameStatus === "taken"}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-cream-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-cream-50 px-3 font-sans text-sm text-slate-hint">
              or
            </span>
          </div>
        </div>

        {/* Google OAuth */}
        <Button
          variant="outline"
          className="w-full"
          size="lg"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          type="button"
        >
          {googleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          Continue with Google
        </Button>

        <p className="mt-8 text-center font-sans text-sm text-slate-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-sage-600 hover:text-sage-800 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
