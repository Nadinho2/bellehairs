"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();

      if (mode === "signup") {
        if (!fullName.trim()) { setError("Full name is required"); return; }
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { data: { full_name: fullName.trim(), role: "staff" } },
        });
        if (signUpError) { setError(signUpError.message); return; }
        if (data.user) {
          // Try to upsert profile — table might not exist yet
          try {
            await supabase.from("profiles").upsert({
              id: data.user.id,
              full_name: fullName.trim(),
              role: "staff",
            });
          } catch {
            // profiles table doesn't exist yet — that's OK, the dashboard will use fallback
          }
        }
        if (data.session) {
          router.replace(next);
        } else {
          setSuccess("Account created! You can now log in.");
          setMode("login");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signInError) { setError(signInError.message); return; }
        router.replace(next);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-white">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white text-xl font-bold">BH</div>
          <h1 className="text-2xl font-bold text-white">Belle Hairs</h1>
          <p className="text-sm text-white/50">Admin Dashboard</p>
        </div>

        {/* Toggle */}
        <div className="flex rounded-xl border border-border overflow-hidden mb-6">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
            className={`flex-1 py-2.5 text-sm font-semibold transition ${mode === "login" ? "bg-brand text-white" : "text-white/60 hover:text-white"}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(null); setSuccess(null); }}
            className={`flex-1 py-2.5 text-sm font-semibold transition ${mode === "signup" ? "bg-brand text-white" : "text-white/60 hover:text-white"}`}
          >
            Sign Up
          </button>
        </div>

        <p className="text-sm text-white/70 text-center mb-6">
          {mode === "login" ? "Sign in with your email and password." : "Create a new staff account."}
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "signup" ? (
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-white">Full Name</span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
                placeholder="e.g. Chioma Okafor"
                required
              />
            </label>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-white">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
              autoComplete="username"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-white">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
              required
            />
          </label>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {success ? <p className="text-sm text-green-400">{success}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A] disabled:opacity-60"
          >
            {loading ? (mode === "login" ? "Signing in…" : "Creating account…") : (mode === "login" ? "Login" : "Create Account")}
          </button>

          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-transparent px-6 py-3 text-sm font-semibold text-white/70 hover:text-white hover:border-white/30 transition"
          >
            Back to site
          </Link>
        </form>

        {mode === "signup" ? (
          <p className="mt-4 text-center text-xs text-white/40">
            New accounts are created as <span className="text-white/60">Staff</span>. An admin can promote you later.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
