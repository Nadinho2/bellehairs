"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { EmailTemplateRow } from "@/lib/supabase/types";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-NG", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

function sanitizeHtml(input: string) {
  let html = String(input ?? "");
  html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/\son\w+="[^"]*"/gi, "");
  html = html.replace(/\son\w+='[^']*'/gi, "");
  return html;
}

function escapeHtml(input: string) {
  return String(input ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderTemplateString(template: string, vars: Record<string, string>) {
  const source = String(template ?? "");
  return source.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => {
    const value = vars[key];
    return typeof value === "string" ? value : "";
  });
}

function brandPreviewHtml(contentHtml: string) {
  const safe = sanitizeHtml(contentHtml);
  return `
    <div style="background:#f5f5f7;padding:24px 12px;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;">
        <div style="background:#000000;padding:18px 22px;">
          <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;font-weight:800;letter-spacing:-0.02em;color:#E91E8C;font-size:18px;">
            Belle Hairs
          </div>
          <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#ffffffb3;font-size:12px;margin-top:2px;">
            A Home of Wigs and Hairs
          </div>
        </div>
        <div style="padding:22px 22px 8px 22px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;">
          ${safe}
        </div>
        <div style="padding:16px 22px 22px 22px;">
          <div style="border-top:1px solid #eee;padding-top:14px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#666;font-size:12px;line-height:18px;">
            © Belle Hairs | Owerri, Nigeria | 0912 691 4795<br />
            <span style="color:#E91E8C;text-decoration:underline;">Unsubscribe</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function ToolbarButton(props: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="rounded-full border border-white/15 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-brand/60"
    >
      {props.label}
    </button>
  );
}

function offerBoxHtml(offer: Record<string, unknown>) {
  const discountCode = typeof offer.discount_code === "string" ? offer.discount_code.trim() : "";
  const discountPercent = Number(offer.discount_percent ?? 0);
  const freeDelivery = Boolean(offer.free_delivery);
  const freeWigCap = Boolean(offer.free_wig_cap);

  const lines: string[] = [];
  if (freeDelivery) lines.push("Free delivery");
  if (discountCode) lines.push(`Discount code: ${discountCode}`);
  if (freeWigCap) lines.push("Free wig cap");

  if (discountCode && Number.isFinite(discountPercent) && discountPercent > 0) {
    return `
      <div style="background:#fff7fb;border:1px solid #ffd0e7;border-radius:14px;padding:14px;margin:12px 0 16px 0;">
        <div style="font-size:12px;color:#555;font-weight:800;letter-spacing:0.08em;">DISCOUNT</div>
        <div style="font-size:24px;color:#E91E8C;font-weight:900;margin-top:6px;">${Math.round(discountPercent)}% OFF</div>
        <div style="margin-top:8px;font-size:13px;color:#444;line-height:20px;">
          Code: <strong>${escapeHtml(discountCode)}</strong>
        </div>
      </div>
    `;
  }

  if (!lines.length) return "";
  return `
    <div style="background:#fff7fb;border:1px solid #ffd0e7;border-radius:14px;padding:14px;margin:12px 0 16px 0;">
      <div style="font-size:12px;color:#555;font-weight:800;letter-spacing:0.08em;">OFFER</div>
      <div style="margin-top:8px;font-size:13px;color:#444;line-height:20px;">
        ${escapeHtml(lines.join(" • "))}
      </div>
    </div>
  `;
}

function sampleVarsForTemplate(t: EmailTemplateRow) {
  const offer = (t.offer && typeof t.offer === "object" ? t.offer : {}) as Record<string, unknown>;
  const discountCode = typeof offer.discount_code === "string" ? offer.discount_code.trim() : "BELLE5";
  const discountPercent = Number(offer.discount_percent ?? 5) || 5;

  const sampleOrderSummary = `
    <div style="border:1px solid #eee;border-radius:14px;padding:14px;">
      <div style="font-weight:900;color:#111;font-size:14px;margin-bottom:10px;">Order Summary</div>
      <div style="color:#666;font-size:13px;">(Preview) Order items will render here.</div>
    </div>
  `;
  const samplePaymentInstructions = `
    <div style="margin-top:14px;background:#fff7fb;border:1px solid #ffd0e7;border-radius:14px;padding:14px;">
      <div style="font-weight:900;color:#111;font-size:14px;">Payment instructions</div>
      <div style="margin-top:6px;color:#444;font-size:14px;line-height:22px;">
        Simply make payment via bank transfer and send your proof of payment to <strong>0912 691 4795</strong> on WhatsApp to confirm your order.
      </div>
    </div>
  `;
  const sampleEtaBox = `
    <div style="margin-top:14px;background:#fff7fb;border:1px solid #ffd0e7;border-radius:14px;padding:14px;">
      <div style="font-weight:900;color:#111;font-size:14px;">Estimated delivery time</div>
      <div style="margin-top:6px;color:#444;font-size:14px;line-height:22px;">(Preview) 1–3 business days</div>
    </div>
  `;
  const sampleCta = `<a href="https://wa.me/2349126914795" style="display:inline-block;background:#E91E8C;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:999px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:14px;font-weight:800;">Send Proof on WhatsApp</a>`;

  return {
    customer_name: escapeHtml("Jane Doe"),
    customer_first_name: escapeHtml("Jane"),
    order_id: escapeHtml("ORDER_12345"),
    order_summary: sampleOrderSummary,
    payment_instructions: samplePaymentInstructions,
    delivery_eta_box: sampleEtaBox,
    offer_discount_code: escapeHtml(discountCode),
    offer_discount_percent: escapeHtml(String(Math.round(discountPercent))),
    offer_box: offerBoxHtml(offer),
    cta_href: escapeHtml("https://wa.me/2349126914795"),
    cta_label: escapeHtml("Send Proof on WhatsApp"),
    cta_button: sampleCta,
    source: escapeHtml("popup"),
    headline: escapeHtml("New Arrival Alert"),
    message: escapeHtml("Fresh drop just landed. Limited pieces available — grab yours now."),
  };
}

export default function AdminEmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selected = useMemo(() => templates.find((t) => t.key === selectedKey) ?? null, [selectedKey, templates]);

  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [offer, setOffer] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  const selectTemplate = useCallback((t: EmailTemplateRow | null) => {
    if (!t) return;
    setSelectedKey(t.key);
    setSubject(t.subject ?? "");
    setBodyHtml(t.body_html ?? "");
    setOffer((t.offer && typeof t.offer === "object" ? t.offer : {}) as Record<string, unknown>);
    setSaveMessage(null);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/email-templates", { method: "GET" });
      const json = (await res.json()) as { ok?: boolean; templates?: EmailTemplateRow[]; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to load templates.");
      const nextTemplates = json.templates ?? [];
      setTemplates(nextTemplates);
      const nextSelected =
        (selectedKey ? nextTemplates.find((t) => t.key === selectedKey) : null) ?? nextTemplates[0] ?? null;
      if (nextSelected) selectTemplate(nextSelected);
      else setSelectedKey(null);
    } catch (err) {
      setTemplates([]);
      setLoadError((err as Error).message || "Failed to load templates.");
    } finally {
      setLoading(false);
    }
  }, [selectTemplate, selectedKey]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(t);
  }, [refresh]);

  const grouped = useMemo(() => {
    const map = new Map<string, EmailTemplateRow[]>();
    for (const t of templates) {
      const key = String(t.category ?? "system");
      map.set(key, [...(map.get(key) ?? []), t]);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [templates]);

  const insertAtSelection = useCallback((insert: string) => {
    const el = editorRef.current;
    if (!el) {
      setBodyHtml((prev) => prev + insert);
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + insert + el.value.slice(end);
    setBodyHtml(next);
    window.setTimeout(() => {
      el.focus();
      const pos = start + insert.length;
      el.setSelectionRange(pos, pos);
    }, 0);
  }, []);

  const wrapSelection = useCallback((open: string, close: string) => {
    const el = editorRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selectedText = el.value.slice(start, end);
    const next = el.value.slice(0, start) + open + selectedText + close + el.value.slice(end);
    setBodyHtml(next);
    window.setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + open.length, start + open.length + selectedText.length);
    }, 0);
  }, []);

  const previewHtml = useMemo(() => {
    if (!selected) return "";
    const vars = sampleVarsForTemplate({
      ...selected,
      subject,
      body_html: bodyHtml,
      offer,
    });
    const inner = sanitizeHtml(renderTemplateString(bodyHtml, vars));
    return brandPreviewHtml(inner);
  }, [bodyHtml, offer, selected, subject]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-border bg-card p-10 text-white">
          <p className="text-sm text-white/70">Loading email templates…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-brand">Admin</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">Email Templates</h1>
          <p className="text-sm text-foreground/70">Edit system emails and payment reminders.</p>
          {loadError ? <p className="text-sm font-semibold text-brand">{loadError}</p> : null}
          {saveMessage ? <p className="text-sm font-semibold text-white">{saveMessage}</p> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => refresh()}
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand"
          >
            Refresh
          </button>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand"
          >
            Back to admin
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-3xl border border-border bg-card p-5 text-white">
          <p className="text-sm font-semibold text-white">Templates</p>
          <div className="mt-4 space-y-5">
            {grouped.length ? (
              grouped.map(([cat, rows]) => (
                <div key={cat}>
                  <p className="text-xs font-semibold text-white/60">{cat.toUpperCase()}</p>
                  <div className="mt-2 space-y-2">
                    {rows.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => selectTemplate(t)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                          selectedKey === t.key
                            ? "border-brand bg-black text-white"
                            : "border-white/10 bg-black/40 text-white/80 hover:border-brand/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate">{t.name}</span>
                          <span className="text-xs text-white/50">{t.key}</span>
                        </div>
                        <p className="mt-1 text-xs text-white/50">Edited: {formatDate(t.updated_at ?? t.created_at)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-white/70">No templates found.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 text-white">
          {selected ? (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-brand">Editing</p>
                  <p className="mt-1 truncate text-lg font-semibold text-white">{selected.name}</p>
                  <p className="mt-1 text-xs text-white/60">
                    Key: {selected.key} • Last edited: {formatDate(selected.updated_at ?? selected.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="rounded-full border border-white/15 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-brand/60"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={async () => {
                      setSaving(true);
                      setSaveMessage(null);
                      try {
                        const res = await fetch("/api/admin/email-templates", {
                          method: "PATCH",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({
                            key: selected.key,
                            subject,
                            body_html: bodyHtml,
                            offer,
                          }),
                        });
                        const json = (await res.json()) as { ok?: boolean; error?: string; template?: EmailTemplateRow | null };
                        if (!res.ok || !json.ok) throw new Error(json.error || "Failed to save template.");
                        setSaveMessage("Saved.");
                        setTemplates((prev) =>
                          prev.map((t) => (t.key === selected.key && json.template ? json.template : t)),
                        );
                        window.setTimeout(() => setSaveMessage(null), 1500);
                      } catch (err) {
                        setSaveMessage((err as Error).message || "Failed to save template.");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#C2177A] disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-white">Subject line</span>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
                  />
                </label>

                <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
                  <p className="text-sm font-semibold text-white">Offer details</p>
                  <p className="mt-1 text-xs text-white/60">
                    These values can be referenced in templates using placeholders like{" "}
                    <span className="font-semibold text-white/80">{"{{offer_discount_code}}"}</span>.
                  </p>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="text-sm font-semibold text-white">Discount code</span>
                      <input
                        value={typeof offer.discount_code === "string" ? offer.discount_code : ""}
                        onChange={(e) =>
                          setOffer((prev) => ({
                            ...prev,
                            discount_code: e.target.value.toUpperCase(),
                          }))
                        }
                        className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm font-semibold text-white">Discount percent</span>
                      <input
                        inputMode="numeric"
                        value={
                          typeof offer.discount_percent === "number" || typeof offer.discount_percent === "string"
                            ? String(offer.discount_percent)
                            : ""
                        }
                        onChange={(e) =>
                          setOffer((prev) => ({
                            ...prev,
                            discount_percent: Number(e.target.value.replace(/[^\d.]/g, "")) || 0,
                          }))
                        }
                        className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
                      />
                    </label>
                    <label className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-semibold text-white">
                      <input
                        type="checkbox"
                        checked={Boolean(offer.free_delivery)}
                        onChange={(e) => setOffer((prev) => ({ ...prev, free_delivery: e.target.checked }))}
                        className="h-4 w-4 accent-brand"
                      />
                      Free delivery
                    </label>
                    <label className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-semibold text-white">
                      <input
                        type="checkbox"
                        checked={Boolean(offer.free_wig_cap)}
                        onChange={(e) => setOffer((prev) => ({ ...prev, free_wig_cap: e.target.checked }))}
                        className="h-4 w-4 accent-brand"
                      />
                      Free wig cap
                    </label>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Email body (HTML)</p>
                      <p className="mt-1 text-xs text-white/60">
                        Supports placeholders like <span className="font-semibold text-white/80">{"{{customer_name}}"}</span>.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ToolbarButton label="Bold" onClick={() => wrapSelection("<strong>", "</strong>")} />
                      <ToolbarButton label="Italic" onClick={() => wrapSelection("<em>", "</em>")} />
                      <ToolbarButton
                        label="Link"
                        onClick={() =>
                          wrapSelection('<a href="https://example.com" target="_blank" rel="noreferrer">', "</a>")
                        }
                      />
                      <ToolbarButton
                        label="Image"
                        onClick={() =>
                          insertAtSelection(
                            '<img src="https://placehold.co/560x360/png" alt="Image" style="width:100%;height:auto;border-radius:12px;display:block;" />',
                          )
                        }
                      />
                      <ToolbarButton label="Line" onClick={() => insertAtSelection("<br />\n")} />
                    </div>
                  </div>

                  <textarea
                    ref={editorRef}
                    value={bodyHtml}
                    onChange={(e) => setBodyHtml(e.target.value)}
                    className="mt-4 h-[360px] w-full resize-y rounded-2xl border border-white/15 bg-black/40 p-4 font-mono text-xs text-white outline-none focus:ring-2 focus:ring-brand/40"
                    spellCheck={false}
                  />
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-white/70">Select a template to edit.</p>
          )}
        </div>
      </div>

      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-[#0b0b0e] p-5 text-white">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">Preview</p>
                <p className="truncate text-xs text-white/60">{selected?.name ?? ""}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-full border border-white/15 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-brand/60"
              >
                Close
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white">
              <iframe title="Email preview" className="h-[70vh] w-full" srcDoc={previewHtml} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
