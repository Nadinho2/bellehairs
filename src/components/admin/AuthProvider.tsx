"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProfileRow } from "@/lib/supabase/types";

type AuthContextValue = {
  profile: ProfileRow | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  profile: null,
  loading: true,
  refresh: async () => {},
  signOut: async () => {},
});

export function useAdminAuth() {
  return useContext(AuthContext);
}

export function AuthProvider(props: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        return;
      }

      // Try to load profile from profiles table
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        // profiles table might not exist yet — create a fallback profile
        // so the dashboard is still usable before the migration is run
        setProfile({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Admin",
          role: "admin",
          created_at: new Date().toISOString(),
        });
      } else {
        setProfile(data as ProfileRow);
      }
    } catch {
      // If everything fails, still allow access with a basic profile
      setProfile({
        id: "fallback",
        full_name: "Admin",
        role: "admin",
        created_at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    window.location.href = "/admin/login";
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ profile, loading, refresh: load, signOut }}>
      {props.children}
    </AuthContext.Provider>
  );
}
