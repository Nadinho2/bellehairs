"use client";

import Link from "next/link";

export default function HowToOrderPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="text-center">
        <p className="text-xs font-semibold text-brand">Belle Hairs</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
          How to Order from Belle Hairs
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-foreground/70">
          Ordering is easy. Follow these simple steps and we&apos;ll take care of the
          rest.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StepCard
          step={1}
          icon="👀"
          title="Browse our products"
          description="Find the wig, weavon, bundles, or accessories you love."
        />
        <StepCard
          step={2}
          icon="💬"
          title="Order on WhatsApp"
          description="Click “Order on WhatsApp” or add to cart to continue."
        />
        <StepCard
          step={3}
          icon="💳"
          title="Confirm & pay"
          description="We confirm your order and share payment details."
        />
        <StepCard
          step={4}
          icon="🚚"
          title="We deliver to you"
          description="Sit back — we deliver to your door in Nigeria."
        />
      </div>

      <div className="mt-12 flex justify-center">
        <Link
          href="/products"
          className="inline-flex items-center justify-center rounded-full bg-brand px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
        >
          Start Shopping
        </Link>
      </div>
    </div>
  );
}

function StepCard(props: {
  step: number;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-black p-6 text-white transition hover:border-brand">
      <p className="text-3xl text-brand">{props.icon}</p>
      <p className="mt-4 text-sm font-semibold text-brand">Step {props.step}</p>
      <p className="mt-2 text-lg font-semibold text-white">{props.title}</p>
      <p className="mt-2 text-sm text-white/70">{props.description}</p>
    </div>
  );
}
