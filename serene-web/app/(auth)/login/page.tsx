"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

// Auth pages are always dynamic — depends on session and OAuth redirects
export const dynamic = "force-dynamic";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { signInSchema, type SignInInput } from "@/lib/auth/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heading, Body } from "@/components/ui/typography";

/* Map Supabase error messages to user-friendly copy — never expose raw errors */
function mapAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "Email or password is incorrect.";
  }
  if (message.includes("Email not confirmed")) {
    return "Please check your email to confirm your account first.";
  }
  return "Something went wrong. Please try again.";
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  async function onSubmit(values: SignInInput) {
    setServerError(null);
    const { error, data } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setServerError(mapAuthError(error.message));
      return;
    }

    /* Route based on onboarding status */
    if (data.user) {
      const { data: profile } = await supabase
        .from("users")
        .select("onboarding_completed")
        .eq("id", data.user.id)
        .single();
      router.push(profile?.onboarding_completed ? "/feed" : "/onboarding");
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    /* Page will navigate away — no need to reset loading */
  }

  return (
    <main className="min-h-screen bg-cream-50 flex items-center justify-center px-8 py-16">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-10 space-y-2">
          <Heading as="h1" size="lg">
            Welcome back
          </Heading>
          <Body muted>Your space is waiting.</Body>
        </div>

        {/* Sign-in form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
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

          {/* Password */}
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
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Server-level error */}
          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
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
            /* Google "G" mark — inline SVG, no external fetch */
            <svg
              className="mr-2 h-4 w-4"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
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

        {/* Switch to signup */}
        <p className="mt-8 text-center font-sans text-sm text-slate-muted">
          New to Serene?{" "}
          <Link
            href="/signup"
            className="text-sage-600 hover:text-sage-800 transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
