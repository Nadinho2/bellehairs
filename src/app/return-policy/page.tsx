"use client";

export default function ReturnPolicyPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <div className="text-center">
        <p className="text-xs font-semibold text-brand">BelleHairs Owerri</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
          Return & Exchange Policy
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-foreground/70">
          We want you to love your hair. If there&apos;s an issue, we&apos;ll help you
          resolve it quickly.
        </p>
      </div>

      <div className="mt-10 space-y-6">
        <Section
          title="What we accept for return"
          items={[
            "Wrong item sent (not what you ordered).",
            "Damaged item on arrival (must be reported within 24 hours).",
          ]}
        />
        <Section
          title="What we don’t accept"
          items={[
            "Used hair or worn wigs.",
            "Hair removed from the original packaging.",
            "Items damaged after delivery due to improper handling.",
          ]}
        />
        <Section
          title="How to initiate a return"
          items={[
            "Message us on WhatsApp: 0912 691 4795 within 24 hours of delivery.",
            "Send your order details and a clear photo/video of the issue.",
            "We’ll confirm eligibility and share the next steps.",
          ]}
        />
        <Section
          title="Exchange process & timeline"
          items={[
            "Once approved, exchanges are processed within 3–5 business days.",
            "If the exact item is unavailable, we’ll offer a suitable replacement.",
          ]}
        />
        <Section
          title="Refund method"
          items={[
            "Refunds are processed via bank transfer or store credit (based on your preference).",
            "Processing starts after the returned item is confirmed (if applicable).",
          ]}
        />
      </div>

      <div className="mt-10 rounded-3xl border border-black/10 bg-black p-6 text-white">
        <p className="text-sm font-semibold text-brand">Need help?</p>
        <p className="mt-2 text-sm text-white/70">
          Chat with us on WhatsApp:{" "}
          <a
            className="font-semibold text-white hover:text-brand"
            href="https://wa.me/2349126914795"
            target="_blank"
            rel="noreferrer"
          >
            0912 691 4795
          </a>
        </p>
      </div>
    </div>
  );
}

function Section(props: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 text-white">
      <p className="text-lg font-semibold text-white">{props.title}</p>
      <ul className="mt-4 space-y-2 text-sm text-white/70">
        {props.items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-brand">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
