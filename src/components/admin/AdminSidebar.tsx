"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAdminAuth } from "./AuthProvider";

const NAV_ITEMS = [
  { href: "/admin/leads", label: "Overview", icon: "🏠", adminOnly: false },
  { href: "/admin/leads/orders", label: "Orders", icon: "📦", adminOnly: false },
  { href: "/admin/leads/enquiries", label: "Enquiries", icon: "💬", adminOnly: false },
  { href: "/admin/leads/customers", label: "Customers", icon: "👥", adminOnly: false },
  { href: "/admin/leads/analytics", label: "Analytics", icon: "📈", adminOnly: true },
  { href: "/admin/leads/staff", label: "Staff", icon: "👩‍💼", adminOnly: true },
  { href: "/admin", label: "← Back to Admin", icon: "🔙", adminOnly: false },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = profile?.role === "admin";

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-border text-white lg:hidden"
        aria-label="Toggle menu"
      >
        {mobileOpen ? "✕" : "☰"}
      </button>

      {/* Mobile overlay */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-card border-r border-border transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white text-sm font-bold">
            BH
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Belle Hairs</p>
            <p className="text-[10px] text-white/50">Dashboard</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand/15 text-brand"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info + Logout */}
        <div className="border-t border-border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-brand text-xs font-bold">
              {profile?.full_name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {profile?.full_name || "Loading..."}
              </p>
              <p className="text-[10px] text-white/50 uppercase">
                {profile?.role || ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="w-full rounded-xl border border-border px-3 py-2 text-xs font-medium text-white/60 hover:text-white hover:border-white/20 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Bottom mobile tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around bg-card border-t border-border px-2 py-2 lg:hidden">
        {visibleItems.slice(0, 5).map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${
                isActive ? "text-brand" : "text-white/50"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </>
  );
}
