"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import type { User } from "@/types/database";

interface UserContextValue {
  supabaseUser: SupabaseUser | null;
  profile: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Use a ref so the supabase instance is stable across renders
  const supabaseRef = useRef(supabase);

  async function fetchProfile(userId: string) {
    const { data } = await supabaseRef.current
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);
  }

  async function refreshProfile() {
    if (supabaseUser) await fetchProfile(supabaseUser.id);
  }

  async function signOut() {
    await supabaseRef.current.auth.signOut();
    setProfile(null);
    setSupabaseUser(null);
    setSession(null);
  }

  useEffect(() => {
    supabaseRef.current.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabaseRef.current.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      // Onboarding redirect is handled server-side by the OAuth callback route
      // and client-side in the login/signup forms.
      void event;
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <UserContext.Provider
      value={{
        supabaseUser,
        profile,
        session,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside <UserProvider>");
  return ctx;
}
