"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import EmailCaptureModal from "@/components/EmailCaptureModal";
import { getCookie, setCookie } from "@/lib/cookies";
import { hasSubscriberEmail } from "@/lib/emails";
import { formatPrice } from "@/lib/format";
import { useWishlist } from "@/lib/wishlist";
import { useCartStore } from "@/store/cartStore";
import type { DbProductCategory } from "@/lib/supabase/types";
import type { Product } from "@/types/product";

const SUBSCRIBED_COOKIE = "bh_email_subscribed";
const PROMO_LAST_SHOWN_COOKIE = "bh_promo_last_shown";

function SectionTitle(props: { title: string }) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        {props.title}
      </h2>
      <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-brand" />
    </div>
  );
}

function useReveal() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add("reveal-in");
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

function HeartIcon(props: { className?: string; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={props.filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      aria-hidden="true"
    >
      <path d="M20.8 4.6c-1.8-1.7-4.6-1.7-6.4 0l-0.4 0.4-0.4-0.4c-1.8-1.7-4.6-1.7-6.4 0-2 1.9-2 5 0 6.9l6.8 6.4 6.8-6.4c2-1.9 2-5 0-6.9z" />
    </svg>
  );
}

function productTag(product: Product) {
  const hair = product.hairType ? product.hairType.replace(" Hair", "") : "Premium";
  const texture = product.texture ? product.texture : "";
  return texture ? `${hair} • ${texture}` : hair;
}

function HomeProductCard(props: { product: Product }) {
  const { product } = props;
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const wishlist = useWishlist();

  const cartId = useMemo(() => `${product.id}:base`, [product.id]);
  const inCart = useMemo(() => cartItems.some((i) => i.id === cartId), [cartId, cartItems]);

  return (
    <div className="relative w-[270px] shrink-0 overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm transition hover:shadow-md sm:w-auto">
      <button
        type="button"
        onClick={() => wishlist.toggle(product.id)}
        className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-sm hover:border-brand"
        aria-label="Add to wishlist"
      >
        <HeartIcon
          className={`h-5 w-5 ${wishlist.ids.includes(product.id) ? "text-brand" : "text-black"}`}
          filled={wishlist.ids.includes(product.id)}
        />
      </button>

      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-[4/3] w-full bg-black">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover opacity-95"
            unoptimized={product.image.startsWith("data:")}
          />
        </div>
      </Link>

      <div className="p-5">
        <p className="text-xs font-semibold text-brand">{productTag(product)}</p>
        <p className="mt-1 line-clamp-2 font-semibold tracking-tight text-black">
          {product.name}
        </p>
        <p className="mt-2 text-sm font-semibold text-black">
          {formatPrice(product.price)}
        </p>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => {
              if (!inCart) addItem(product.id);
              router.push("/checkout");
            }}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
          >
            Order on WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryCard(props: { title: string; href: string; image?: string | null }) {
  return (
    <Link
      href={props.href}
      className="group relative overflow-hidden rounded-3xl border border-black/10 bg-black"
    >
      <div className="relative aspect-[4/3] w-full">
        {props.image ? (
          <Image src={props.image} alt={props.title} fill className="object-cover opacity-85" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-brand">
            <p className="text-3xl leading-none text-white" style={{ fontFamily: "var(--font-logo)" }}>
              Belle Hairs
            </p>
          </div>
        )}
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 flex items-end p-6">
          <div className="space-y-1">
            <p className="text-xl font-semibold text-white">{props.title}</p>
            <p className="text-sm font-semibold text-brand">Shop now</p>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-0 ring-brand transition group-hover:ring-2" />
    </Link>
  );
}

function HowToOrderStep(props: {
  step: number;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/15 bg-black p-6 text-white transition hover:border-brand">
      <p className="text-3xl text-brand">{props.icon}</p>
      <p className="mt-4 text-sm font-semibold text-brand">Step {props.step}</p>
      <p className="mt-2 text-lg font-semibold text-white">{props.title}</p>
      <p className="mt-2 text-sm text-white/70">{props.description}</p>
    </div>
  );
}

function isSubscribed() {
  return getCookie(SUBSCRIBED_COOKIE) === "1" || hasSubscriberEmail();
}

export default function HomeClient(props: {
  newArrivals: Product[];
  bestSellers: Product[];
  featured: Product[];
  socialImages: (string | null)[];
  categoryCardImages?: Record<DbProductCategory, string | null>;
}) {
  const [promoOpen, setPromoOpen] = useState(false);

  useEffect(() => {
    if (isSubscribed()) return;
    const lastShownRaw = getCookie(PROMO_LAST_SHOWN_COOKIE);
    const lastShown = lastShownRaw ? Number(lastShownRaw) : 0;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (
      Number.isFinite(lastShown) &&
      lastShown > 0 &&
      Date.now() - lastShown < sevenDaysMs
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      setCookie(PROMO_LAST_SHOWN_COOKIE, String(Date.now()), 7);
      setPromoOpen(true);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, []);

  const heroRef = useReveal();
  const categoryRef = useReveal();
  const newRef = useReveal();
  const bestRef = useReveal();
  const howToOrderRef = useReveal();
  const whyRef = useReveal();
  const socialRef = useReveal();
  const contactRef = useReveal();

  const dedupedNewArrivals = useMemo(() => {
    const hairOnly = props.newArrivals.filter(
      (p) => p.category === "Wigs" || p.category === "Weavon" || p.category === "Bundles" || p.category === "Closures" || p.category === "Frontals",
    );
    const bestIds = new Set(props.bestSellers.map((p) => p.id));
    return hairOnly.filter((p) => !bestIds.has(p.id)).slice(0, 6);
  }, [props.newArrivals, props.bestSellers]);

  const dedupedBestSellers = useMemo(() => {
    const hairOnly = props.bestSellers.filter(
      (p) => p.category === "Wigs" || p.category === "Weavon" || p.category === "Bundles" || p.category === "Closures" || p.category === "Frontals",
    );
    const newArrivalIds = new Set(dedupedNewArrivals.map((p) => p.id));
    return hairOnly.filter((p) => !newArrivalIds.has(p.id)).slice(0, 6);
  }, [props.bestSellers, dedupedNewArrivals]);

  return (
    <div className="w-full">
      <EmailCaptureModal
        open={promoOpen}
        onClose={() => setPromoOpen(false)}
        title="Get 10% Off Your First Order! 💕"
        ctaLabel="Claim My Discount"
        source="popup"
        onSuccess={() => {
          setCookie(SUBSCRIBED_COOKIE, "1", 365);
          setPromoOpen(false);
        }}
      />

      <section ref={heroRef} className="reveal bg-[#0a0a0a] pt-12 pb-20 md:pt-16 md:pb-24">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold tracking-[0.22em] text-brand">
              ✦ PREMIUM HAIR — OWERRI, NIGERIA
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-6xl">
              Your Crown Deserves the{" "}
              <span className="font-bold italic text-brand">Very Best</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-white/60 md:text-base">
              Shop premium wigs, weavon & accessories. Delivered nationwide.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/products?category=Wigs"
                className="inline-flex items-center justify-center rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#C2177A]"
              >
                Shop Wigs
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-transparent px-7 py-3 text-sm font-semibold text-white transition hover:border-brand"
              >
                Browse All
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section ref={categoryRef} className="reveal pt-20 pb-20 bg-white md:pt-20 md:pb-20">
        <div className="mx-auto w-full max-w-6xl px-4">
          <SectionTitle title="Shop by Category" />
          <div className="mt-6 text-center">
            <p className="text-xs font-semibold tracking-[0.18em] text-foreground/50">HAIR PRODUCTS</p>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <CategoryCard
              title="Wigs"
              href="/products?category=Wigs"
              image={
                props.categoryCardImages?.Wigs ??
                "https://images.unsplash.com/photo-1541269620759-5c594a1c43c5?auto=format&fit=crop&w=1400&q=80"
              }
            />
            <CategoryCard
              title="Weavon"
              href="/products?category=Weavon"
              image={
                props.categoryCardImages?.Weavon ??
                "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1400&q=80"
              }
            />
          </div>

          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-foreground/50 text-center">ACCESSORIES</p>
            <Link
              href="/products?category=Accessories"
              className="group relative block overflow-hidden rounded-2xl bg-black"
            >
              <div className="relative h-[160px] w-full md:h-[180px]">
                {props.categoryCardImages?.Accessories ? (
                  <Image
                    src={props.categoryCardImages.Accessories}
                    alt="Accessories"
                    fill
                    className="object-cover opacity-85"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 bg-black" />
                )}
                <div className="absolute inset-0 bg-black/45" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-1">
                    <p className="text-lg font-semibold text-white">Accessories & Hair Care</p>
                    <p className="text-sm font-semibold text-brand">Wig caps, glue, oils & more →</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section ref={newRef} className="reveal pt-20 pb-20 bg-[#f7f7f7] md:pt-20 md:pb-20">
        <div className="mx-auto w-full max-w-6xl px-4">
          <SectionTitle title="New Arrivals" />
          <div className="mt-10 flex gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
            {dedupedNewArrivals.map((p) => (
              <HomeProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Link
              href="/products?sort=newest"
              className="inline-flex items-center justify-center rounded-full border border-black bg-white px-6 py-3 text-sm font-semibold text-black shadow-sm transition hover:border-brand"
            >
              See All New Arrivals
            </Link>
          </div>
        </div>
      </section>

      <section ref={bestRef} className="reveal pt-20 pb-20 bg-white md:pt-20 md:pb-20">
        <div className="mx-auto w-full max-w-6xl px-4">
          <SectionTitle title="Best Sellers" />
          <div className="mt-10 flex gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
            {dedupedBestSellers.map((p) => (
              <HomeProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Link
              href="/products?bestSeller=1"
              className="inline-flex items-center justify-center rounded-full border border-black bg-white px-6 py-3 text-sm font-semibold text-black shadow-sm transition hover:border-brand"
            >
              See All Best Sellers
            </Link>
          </div>
        </div>
      </section>

      <section ref={howToOrderRef} className="reveal bg-black pt-20 pb-20 md:pt-20 md:pb-20">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
              How to Order
            </h2>
            <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-brand" />
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <HowToOrderStep
              step={1}
              icon="👀"
              title="Browse Products"
              description="Explore our wigs, weavon & accessories"
            />
            <HowToOrderStep
              step={2}
              icon="💬"
              title="Order on WhatsApp"
              description="Click the button and chat with us directly"
            />
            <HowToOrderStep
              step={3}
              icon="💳"
              title="Confirm & Pay"
              description="Pay securely via transfer or cash on pickup"
            />
            <HowToOrderStep
              step={4}
              icon="🚚"
              title="We Deliver to You"
              description="Fast delivery across Nigeria"
            />
          </div>
          <div className="mt-10 flex justify-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
            >
              Start Shopping Now
            </Link>
          </div>
        </div>
      </section>

      <section ref={whyRef} className="reveal pt-20 pb-20 bg-white md:pt-20 md:pb-20">
        <div className="mx-auto w-full max-w-6xl px-4">
          <SectionTitle title="Why Choose Belle Hairs?" />
          <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { icon: "💯", title: "Premium Quality", desc: "Soft texture, fullness, and luxury finish." },
              { icon: "🚚", title: "Nationwide Delivery", desc: "Fast, reliable delivery across Nigeria." },
              { icon: "💬", title: "Easy WhatsApp Order", desc: "Chat, confirm, and order in minutes." },
              { icon: "📍", title: "Based in Owerri", desc: "Trusted local brand, nationwide service." },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <p className="text-3xl">{item.icon}</p>
                <p className="mt-3 text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-xs text-foreground/60 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={socialRef} className="reveal pt-20 pb-20 bg-[#f7f7f7] md:pt-20 md:pb-20">
        <div className="mx-auto w-full max-w-6xl px-4">
          <SectionTitle title="Follow Us @bellehairsng" />
          <div className="mt-10 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden justify-center">
            {props.socialImages.slice(0, 3).map((src, idx) => (
              <a
                key={idx}
                href="https://www.tiktok.com/@bellehairsng."
                target="_blank"
                rel="noreferrer"
                className="relative h-28 w-44 shrink-0 overflow-hidden rounded-2xl border border-black/10 bg-black sm:h-36 sm:w-56"
              >
                {src ? (
                  <Image
                    src={src}
                    alt="Belle Hairs social"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-brand">
                    <p
                      className="text-2xl leading-none text-white"
                      style={{ fontFamily: "var(--font-logo)" }}
                    >
                      Belle Hairs
                    </p>
                  </div>
                )}
              </a>
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-foreground/70">
            Tag us in your photos for a chance to be featured! 💕
          </p>
        </div>
      </section>

      <section ref={contactRef} className="reveal bg-brand pt-12 pb-12 md:pt-14 md:pb-14">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-6 text-center text-white md:flex-row md:text-left">
            <p className="text-2xl font-semibold">Ready to slay? Let&apos;s talk! 💬</p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <a
                href="https://wa.me/2349126914795?text=Hello%20Belle%20Hairs%2C%20I%20want%20to%20make%20an%20enquiry."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
              >
                WhatsApp Us
              </a>
              <a
                href="tel:+2349126914795"
                className="inline-flex items-center justify-center rounded-full border border-white bg-white px-6 py-3 text-sm font-semibold text-black shadow-sm transition hover:opacity-95"
              >
                Call Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
