"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "How do I place an order?",
    a: "Browse products, tap “Order on WhatsApp” or add to cart, then complete checkout to send your order details to our WhatsApp.",
  },
  {
    q: "Do you deliver outside Owerri?",
    a: "Yes. We deliver nationwide across Nigeria.",
  },
  {
    q: "How long does delivery take?",
    a: "Delivery time depends on your state and city/LGA. You’ll see an estimate at checkout after selecting your location.",
  },
  {
    q: "Can I pay on delivery?",
    a: "We do not offer pay on delivery for all items. In some cases we can allow cash on pickup in Owerri. Please chat with us to confirm.",
  },
  {
    q: "Do you do instalment payments?",
    a: "Not at the moment. Full payment is required to confirm orders.",
  },
  {
    q: "How do I know which length to choose?",
    a: "On the product page, select a length to preview the price. If you’re unsure, chat with us on WhatsApp and we’ll recommend the best length for your desired look.",
  },
  {
    q: "What is the difference between Human Hair and Vietnamese Hair?",
    a: "Both are premium options. Vietnamese hair is known for its silky feel, thickness, and long-lasting durability. Our Human Hair options are natural-looking and versatile for everyday wear.",
  },
  {
    q: "How do I care for my wig/weavon?",
    a: "Store properly, avoid excessive heat, use gentle products, and wash when needed. For care tips based on your unit, message us on WhatsApp.",
  },
  {
    q: "Can I return or exchange my hair?",
    a: "Yes for eligible cases like wrong item sent or damaged item. Please see our Return & Exchange Policy for full details.",
  },
  {
    q: "How do I contact Belle Hairs?",
    a: "Call/WhatsApp 0912 691 4795 or message us on @bellehairsng.",
  },
] as const;

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <div className="text-center">
        <p className="text-xs font-semibold text-brand">Belle Hairs</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
          Frequently Asked Questions
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-foreground/70">
          Tap a question to view the answer.
        </p>
      </div>

      <div className="mt-10 space-y-3">
        {FAQS.map((item, idx) => {
          const open = openIndex === idx;
          return (
            <div
              key={item.q}
              className="overflow-hidden rounded-3xl border border-border bg-card text-white"
            >
              <button
                type="button"
                onClick={() => setOpenIndex((cur) => (cur === idx ? null : idx))}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                aria-expanded={open}
              >
                <span className="text-base font-semibold text-white">{item.q}</span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white">
                  {open ? "−" : "+"}
                </span>
              </button>
              {open ? (
                <div className="border-t border-white/10 px-6 py-5 text-sm text-white/70">
                  {item.a}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
