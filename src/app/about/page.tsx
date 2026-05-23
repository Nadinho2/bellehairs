export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          <p className="text-xs font-semibold text-brand">About</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            BelleHairs Owerri
          </h1>
          <p className="text-base leading-7 text-foreground/70">
            BelleHairs Owerri is a premium hair brand based in Owerri, Nigeria.
            We help women feel confident with luxury wigs, bundles, closures, and
            frontals — carefully curated for a flawless, feminine finish.
          </p>
          <p className="text-base leading-7 text-foreground/70">
            Our goal is simple: premium quality hair, honest guidance, and a
            smooth ordering experience. If you need help choosing texture,
            length, or the right lace option, chat with us on WhatsApp and we’ll
            recommend what fits your budget and style.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 text-white">
          <div className="space-y-5">
            <div className="rounded-2xl border border-brand/30 bg-black/50 p-5">
              <p className="text-sm font-semibold text-white">Quality first</p>
              <p className="mt-1 text-sm text-white/70">
                Soft texture, great fullness, and a premium finish designed to
                last.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/40 p-5">
              <p className="text-sm font-semibold text-white">Luxury feel</p>
              <p className="mt-1 text-sm text-white/70">
                Clean hairlines, neat lace options, and bold, feminine styling.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/40 p-5">
              <p className="text-sm font-semibold text-white">Personal support</p>
              <p className="mt-1 text-sm text-white/70">
                We help you pick the right length, texture, and fit — especially
                if it’s your first time.
              </p>
            </div>
            <a
              href="https://wa.me/2349126914795?text=Hello%20BelleHairs%20Owerri%2C%20I%20need%20help%20choosing%20a%20wig%20or%20hair."
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
