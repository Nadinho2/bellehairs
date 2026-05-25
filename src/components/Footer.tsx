"use client";

import Link from "next/link";
import { useState } from "react";

import { getCookie, setCookie } from "@/lib/cookies";
import { readSubscriberEmail, writeSubscriberEmail } from "@/lib/emails";

export default function Footer() {
  const [email, setEmail] = useState(() => readSubscriberEmail() ?? "");
  const [success, setSuccess] = useState(
    () => Boolean(readSubscriberEmail()) || getCookie("bh_email_subscribed") === "1",
  );
  const [error, setError] = useState<string | null>(null);

  return (
    <footer className="mt-auto border-t border-white/15 bg-black text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="text-center">
          <p
            className="text-3xl leading-none"
            style={{ fontFamily: "var(--font-logo)" }}
          >
            BelleHairs
          </p>
          <p className="mt-2 text-sm text-white/70">Owerri • A Home of Wigs and Hairs</p>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm font-semibold text-white">Quick Links</p>
            <div className="mt-4 space-y-3 text-sm text-white/80">
              <Link href="/" className="block hover:text-brand">
                Home
              </Link>
              <Link href="/products?group=wigs" className="block hover:text-brand">
                Wigs
              </Link>
              <Link href="/products?group=weavon" className="block hover:text-brand">
                Weavon
              </Link>
              <Link href="/products?category=Accessories" className="block hover:text-brand">
                Accessories
              </Link>
              <Link href="/about" className="block hover:text-brand">
                About
              </Link>
              <Link href="/contact" className="block hover:text-brand">
                Contact
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Categories</p>
            <div className="mt-4 space-y-3 text-sm text-white/80">
              <Link href="/products?hairType=Human%20Hair" className="block hover:text-brand">
                Human Hair
              </Link>
              <Link
                href="/products?hairType=Vietnamese%20Hair"
                className="block hover:text-brand"
              >
                Vietnamese Hair
              </Link>
              <Link href="/products?hairType=Blend%20Hair" className="block hover:text-brand">
                Blend Hair
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Customer Care</p>
            <div className="mt-4 space-y-3 text-sm text-white/80">
              <Link href="/how-to-order" className="block hover:text-brand">
                How to Order
              </Link>
              <Link href="/checkout" className="block hover:text-brand">
                Delivery Info
              </Link>
              <Link href="/return-policy" className="block hover:text-brand">
                Return Policy
              </Link>
              <Link href="/faq" className="block hover:text-brand">
                FAQs
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Contact Us</p>
            <div className="mt-4 space-y-3 text-sm text-white/80">
              <a href="tel:+2349126914795" className="block hover:text-brand">
                0912 691 4795
              </a>
              <span className="block">Owerri, Nigeria</span>
              <a
                href="https://instagram.com/bellehairsng"
                target="_blank"
                rel="noreferrer"
                className="block hover:text-brand"
              >
                @bellehairsng
              </a>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <a
                href="https://www.tiktok.com/@bellehairsng"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black text-white/80 hover:border-brand/60 hover:text-brand"
                aria-label="TikTok"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M16.6 3c.3 2.2 1.7 3.9 3.7 4.6v3.1c-1.4.1-2.7-.3-3.7-1v6.7c0 3.5-2.8 6.3-6.3 6.3S4 19.9 4 16.4c0-3.4 2.6-6.1 6-6.3v3.3c-.2 0-.4-.1-.6-.1-1.6 0-2.9 1.3-2.9 3 0 1.6 1.3 3 2.9 3 1.7 0 3-1.2 3-3V3h3.2z"
                  />
                </svg>
              </a>
              <a
                href="https://instagram.com/bellehairsng"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black text-white/80 hover:border-brand/60 hover:text-brand"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
                  />
                  <path
                    fill="currentColor"
                    d="M17.4 6.6a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6z"
                  />
                </svg>
              </a>
              <a
                href="https://facebook.com/bellehairsng"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black text-white/80 hover:border-brand/60 hover:text-brand"
                aria-label="Facebook"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M13.5 22v-8h2.7l.4-3h-3.1V9.2c0-.9.3-1.6 1.7-1.6h1.5V5c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V11H7v3h3v8h3.5z"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/15 pt-6">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 text-center">
            <p className="text-sm font-semibold text-white">
              Join our VIP list for exclusive deals & new arrivals 💕
            </p>
            {success ? (
              <p className="text-sm font-semibold text-brand">You&apos;re on the list! 🎉</p>
            ) : (
              <form
                className="flex w-full flex-col gap-3 sm:flex-row"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError(null);
                  const normalized = email.trim().toLowerCase();
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
                    setError("Enter a valid email address.");
                    return;
                  }
                  try {
                    const res = await fetch("/api/subscribe", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ email: normalized, source: "footer" }),
                    });
                    const json = (await res.json()) as { ok?: boolean; error?: string };
                    if (!res.ok || !json.ok) throw new Error(json.error || "Failed to subscribe.");
                  } catch (err) {
                    setError((err as Error).message || "Failed to subscribe.");
                    return;
                  }
                  setCookie("bh_email_subscribed", "1", 365);
                  writeSubscriberEmail(normalized);
                  setSuccess(true);
                  setEmail("");
                }}
              >
                <input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  type="email"
                  required
                  inputMode="email"
                  placeholder="Enter your email"
                  className="w-full rounded-full border border-white/15 bg-black/40 px-5 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-brand"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
                >
                  Subscribe
                </button>
              </form>
            )}
            {!success && error ? (
              <p className="text-sm font-semibold text-brand">{error}</p>
            ) : null}
          </div>

          <div className="mt-6 text-center text-xs text-white/60">
            <p>© 2025 BelleHairs Owerri. All Rights Reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
