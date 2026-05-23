"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useWishlist } from "@/lib/wishlist";
import { selectCartCount, useCartStore } from "@/store/cartStore";

function CartIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      aria-hidden="true"
    >
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6l-2 0" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </svg>
  );
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

function SearchIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function MenuIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      aria-hidden="true"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const items = useCartStore((s) => s.items);
  const cartCount = useMemo(() => selectCartCount(items), [items]);
  const wishlist = useWishlist();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/products?group=wigs", label: "Wigs" },
    { href: "/products?group=weavon", label: "Weavon" },
    { href: "/products?category=Accessories", label: "Accessories" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/products")) return pathname.startsWith("/products");
    return pathname === href;
  };

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-brand text-white">
        <div className="mx-auto w-full max-w-6xl overflow-hidden px-4 py-2">
          <div className="marquee inline-flex min-w-full whitespace-nowrap text-sm font-semibold">
            <span className="mx-6">
              💕 Free delivery on orders above ₦50,000 | Call/WhatsApp: 0912 691 4795 |
              Located in Owerri, Nigeria 💕
            </span>
            <span className="mx-6" aria-hidden="true">
              💕 Free delivery on orders above ₦50,000 | Call/WhatsApp: 0912 691 4795 |
              Located in Owerri, Nigeria 💕
            </span>
          </div>
        </div>
      </div>

      <div className="border-b border-white/15 bg-black/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black text-white md:hidden"
            aria-label="Open menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <Link href="/" className="flex items-center gap-2 text-white">
            <span
              className="text-2xl leading-none"
              style={{ fontFamily: "var(--font-logo)" }}
            >
              BelleHairs
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-white/85 md:flex">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className={isActive(l.href) ? "text-brand" : "hover:text-brand"}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <form
              className="hidden items-center gap-2 rounded-full border border-white/15 bg-black px-3 py-2 text-sm text-white md:flex"
              onSubmit={(e) => {
                e.preventDefault();
                const q = query.trim();
                router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
                setSearchOpen(false);
              }}
            >
              <SearchIcon className="h-4 w-4 text-white/70" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-56 bg-transparent text-white placeholder:text-white/50 focus:outline-none"
                aria-label="Search"
              />
            </form>

            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black text-white md:hidden"
              aria-label="Search"
            >
              <SearchIcon className="h-5 w-5" />
            </button>

            <Link
              href="/products?wishlist=1"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black text-white hover:border-brand/60"
              aria-label="Wishlist"
            >
              <HeartIcon className="h-5 w-5" filled={false} />
              {wishlist.count > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-semibold text-white">
                  {wishlist.count}
                </span>
              ) : null}
            </Link>

            <Link
              href="/cart"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black text-white hover:border-brand/60"
              aria-label="Cart"
            >
              <CartIcon className="h-5 w-5" />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-semibold text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </div>

      {searchOpen ? (
        <div className="border-b border-white/15 bg-black md:hidden">
          <div className="mx-auto w-full max-w-6xl px-4 py-3">
            <form
              className="flex items-center gap-2 rounded-full border border-white/15 bg-black px-3 py-2 text-sm text-white"
              onSubmit={(e) => {
                e.preventDefault();
                const q = query.trim();
                router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
                setSearchOpen(false);
              }}
            >
              <SearchIcon className="h-4 w-4 text-white/70" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent text-white placeholder:text-white/50 focus:outline-none"
                aria-label="Search"
              />
            </form>
          </div>
        </div>
      ) : null}

      {menuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute left-0 top-0 h-full w-[280px] bg-black p-5 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <span
                className="text-2xl leading-none"
                style={{ fontFamily: "var(--font-logo)" }}
              >
                BelleHairs
              </span>
              <button
                type="button"
                className="rounded-full border border-white/15 bg-black px-3 py-2 text-sm font-semibold text-white"
                onClick={() => setMenuOpen(false)}
              >
                Close
              </button>
            </div>
            <nav className="mt-6 space-y-3">
              {links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block rounded-2xl border px-4 py-3 text-sm font-semibold ${
                    isActive(l.href)
                      ? "border-brand text-brand"
                      : "border-white/15 text-white hover:border-brand/60 hover:text-brand"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
