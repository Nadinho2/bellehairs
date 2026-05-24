"use client";

import { useMemo, useState } from "react";

import { addEmailToList, type EmailSource } from "@/lib/emails";

export default function EmailCaptureModal(props: {
  open: boolean;
  title: string;
  description?: string;
  ctaLabel: string;
  source: EmailSource;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => email.trim().length > 0, [email]);

  if (!props.open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black p-6 text-white shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xl font-semibold">{props.title}</p>
            {props.description ? (
              <p className="mt-2 text-sm text-white/70">{props.description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white hover:border-brand"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {status === "success" ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">You&apos;re on the list! 🎉</p>
            <p className="mt-1 text-sm text-white/70">
              We&apos;ll send you new arrivals and exclusive deals.
            </p>
          </div>
        ) : (
          <form
            className="mt-6 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const res = addEmailToList(email, props.source);
              if (!res.ok) {
                setStatus("error");
                setErrorMessage(res.message ?? "Something went wrong.");
                return;
              }
              setStatus("success");
              setErrorMessage(null);
              props.onSuccess?.();
            }}
          >
            <label className="block text-sm font-semibold text-white">
              Email Address
              <input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setStatus("idle");
                  setErrorMessage(null);
                }}
                type="email"
                required
                inputMode="email"
                placeholder="you@example.com"
                className="mt-2 w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-brand"
              />
            </label>

            {status === "error" && errorMessage ? (
              <p className="text-sm font-semibold text-brand">{errorMessage}</p>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {props.ctaLabel}
            </button>

            <button
              type="button"
              onClick={props.onClose}
              className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-black px-5 py-3 text-sm font-semibold text-white hover:border-brand"
            >
              Not now
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

