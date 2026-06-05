"use client";

import type { ReactNode } from "react";

export function StatCard(props: {
  icon: string;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  hidden?: boolean;
}) {
  if (props.hidden) return null;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-white/50">{props.label}</p>
          <p className="mt-1 text-2xl font-bold text-white">{props.value}</p>
        </div>
        <span className="text-2xl">{props.icon}</span>
      </div>
      {props.trend ? (
        <p className={`mt-2 text-xs font-medium ${props.trendUp ? "text-green-400" : "text-red-400"}`}>
          {props.trend}
        </p>
      ) : null}
    </div>
  );
}

export function StatusBadge(props: { status: string }) {
  const colors: Record<string, string> = {
    order_received: "bg-yellow-500/20 text-yellow-400",
    payment_received: "bg-blue-500/20 text-blue-400",
    order_confirmed: "bg-purple-500/20 text-purple-400",
    dispatched: "bg-orange-500/20 text-orange-400",
    delivered: "bg-green-500/20 text-green-400",
    cancelled: "bg-red-500/20 text-red-400",
    not_contacted: "bg-red-500/20 text-red-400",
    in_conversation: "bg-yellow-500/20 text-yellow-400",
    converted: "bg-green-500/20 text-green-400",
  };
  const labels: Record<string, string> = {
    order_received: "Order Received",
    payment_received: "Payment Received",
    order_confirmed: "Confirmed",
    dispatched: "Dispatched",
    delivered: "Delivered",
    cancelled: "Cancelled",
    not_contacted: "Not Contacted",
    in_conversation: "In Conversation",
    converted: "Converted",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${colors[props.status] || "bg-white/10 text-white/60"}`}>
      {labels[props.status] || props.status}
    </span>
  );
}

export function SourceBadge(props: { source: string }) {
  const isWebsite = props.source === "website";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
      isWebsite ? "bg-brand/20 text-brand" : "bg-green-500/20 text-green-400"
    }`}>
      {isWebsite ? "🌐 Website" : "💬 WhatsApp"}
    </span>
  );
}

export function TagBadge(props: { tag: string }) {
  const colors: Record<string, string> = {
    vip: "bg-yellow-500/20 text-yellow-400",
    regular: "bg-blue-500/20 text-blue-400",
    first_timer: "bg-green-500/20 text-green-400",
    cold_lead: "bg-white/10 text-white/50",
  };
  const labels: Record<string, string> = {
    vip: "👑 VIP",
    regular: "🔄 Regular",
    first_timer: "🆕 First Timer",
    cold_lead: "❄️ Cold Lead",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${colors[props.tag] || "bg-white/10 text-white/60"}`}>
      {labels[props.tag] || props.tag}
    </span>
  );
}

export function AdminPageHeader(props: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between px-4 lg:px-8 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{props.title}</h1>
        {props.subtitle ? <p className="mt-1 text-sm text-white/50">{props.subtitle}</p> : null}
      </div>
      {props.actions ? <div className="flex flex-wrap gap-2">{props.actions}</div> : null}
    </div>
  );
}

export function DataTable(props: {
  columns: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            {props.columns.map((col) => (
              <th key={col} className="px-4 py-3 text-xs font-semibold text-white/50 uppercase tracking-wider">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{props.children}</tbody>
      </table>
    </div>
  );
}

export function EmptyState(props: { icon: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl">{props.icon}</span>
      <p className="mt-3 text-sm text-white/50">{props.message}</p>
    </div>
  );
}

export function LoadingSkeleton(props: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: props.rows || 5 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-white/5" />
      ))}
    </div>
  );
}

export function ConfirmModal(props: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  danger?: boolean;
}) {
  if (!props.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-white">{props.title}</h3>
        <p className="mt-2 text-sm text-white/60">{props.message}</p>
        <div className="mt-6 flex gap-3 justify-end">
          <button
            type="button"
            onClick={props.onCancel}
            className="rounded-xl border border-border px-4 py-2 text-sm text-white/70 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={props.onConfirm}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
              props.danger ? "bg-red-600 hover:bg-red-700" : "bg-brand hover:bg-[#C2177A]"
            }`}
          >
            {props.confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
