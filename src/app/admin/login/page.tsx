"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <div className="rounded-3xl border border-border bg-card p-8 text-white">
        <p className="text-xs font-semibold text-brand">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Login</h1>
        <p className="mt-2 text-sm text-white/70">
          Sign in with your admin email and password.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setLoading(true);
            try {
              const supabase = createSupabaseBrowserClient();
              const { error: signInError } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password,
              });
              if (signInError) {
                setError(signInError.message);
                return;
              }
              router.replace(next);
            } finally {
              setLoading(false);
            }
          }}
        >
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
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <p className="text-sm text-white/80">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Login"}
          </button>

          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-full border border-black bg-white px-6 py-3 text-sm font-semibold text-black hover:border-brand"
          >
            Back to site
          </Link>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

