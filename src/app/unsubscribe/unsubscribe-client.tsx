"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { setCookie } from "@/lib/cookies";
import { readSubscriberEmail, writeSubscriberEmail } from "@/lib/emails";

export default function UnsubscribeClient() {
  const searchParams = useSearchParams();
  const initial = useMemo(() => {
    const fromQuery = searchParams.get("email");
    return (fromQuery ?? readSubscriberEmail() ?? "").trim().toLowerCase();
  }, [searchParams]);

  const [email, setEmail] = useState(initial);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && status !== "loading";

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12">
      <div className="rounded-3xl border border-border bg-card p-8 text-white">
        <p className="text-xs font-semibold text-brand">BelleHairs</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Unsubscribe</h1>
        <p className="mt-2 text-sm text-white/70">
          Enter your email to stop receiving marketing emails from BelleHairs Owerri.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const normalized = email.trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
              setStatus("error");
              setMessage("Enter a valid email address.");
              return;
            }
            setStatus("loading");
            setMessage(null);
            try {
              const res = await fetch("/api/unsubscribe", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email: normalized }),
              });
              const json = (await res.json()) as { ok?: boolean; error?: string };
              if (!res.ok || !json.ok) throw new Error(json.error || "Failed to unsubscribe.");
              if (readSubscriberEmail() === normalized) writeSubscriberEmail(null);
              setCookie("bh_email_subscribed", "0", 365);
              setStatus("success");
              setMessage("You have been unsubscribed successfully.");
            } catch (err) {
              setStatus("error");
              setMessage((err as Error).message || "Failed to unsubscribe.");
            }
          }}
        >
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-white">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setStatus("idle");
                setMessage(null);
              }}
              className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
              required
            />
          </label>

          {message ? (
            <p className={`text-sm font-semibold ${status === "success" ? "text-brand" : "text-white/80"}`}>
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A] disabled:opacity-60"
          >
            {status === "loading" ? "Unsubscribing…" : "Unsubscribe"}
          </button>
        </form>
      </div>
    </div>
  );
}

