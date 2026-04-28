"use client";

import { useUser } from "@/context/user-context";

export function useSession() {
  const { supabaseUser, profile, session, loading } = useUser();
  return {
    user: supabaseUser,
    profile,
    session,
    loading,
    isAuthenticated: !!supabaseUser,
    onboardingComplete: profile?.onboarding_completed ?? false,
  };
}
