export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          <p className="text-xs font-semibold text-brand">Contact</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            Get in touch
          </h1>
          <p className="text-base leading-7 text-foreground/70">
            We’re based in Owerri, Nigeria. For availability, pricing by length,
            and delivery, chat with us on WhatsApp or call us directly.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 text-white">
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/15 bg-black/40 p-5">
              <p className="text-sm font-semibold text-white">WhatsApp / Phone</p>
              <a
                href="tel:+2349126914795"
                className="mt-1 block text-sm text-brand hover:underline"
              >
                0912 691 4795
              </a>
            </div>

            <div className="rounded-2xl border border-white/15 bg-black/40 p-5">
              <p className="text-sm font-semibold text-white">Location</p>
              <p className="mt-1 text-sm text-white/70">Owerri, Nigeria</p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-black/40 p-5">
              <p className="text-sm font-semibold text-white">Social</p>
              <a
                href="https://instagram.com/bellehairsng"
                target="_blank"
                rel="noreferrer"
                className="mt-1 block text-sm text-brand hover:underline"
              >
                @bellehairsng
              </a>
            </div>

            <a
              href="https://wa.me/2349126914795?text=Hello%20BelleHairs%20Owerri%2C%20I%20want%20to%20make%20an%20enquiry."
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

