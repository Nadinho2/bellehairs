"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type EmailSource = "popup" | "footer" | "checkout" | "exit";

export type EmailEntry = {
  id: string;
  email: string;
  source: EmailSource;
  createdAt: number;
};

export const EMAIL_LIST_STORAGE_KEY = "bellehairs.emailList.v1";
export const EMAIL_LIST_UPDATED_EVENT = "bellehairs.emailList.updated";

type Payload = {
  version: 1;
  entries: EmailEntry[];
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function readPayload(): Payload {
  try {
    const raw = localStorage.getItem(EMAIL_LIST_STORAGE_KEY);
    if (!raw) return { version: 1, entries: [] };
    const parsed = JSON.parse(raw) as Payload;
    if (parsed?.version !== 1 || !Array.isArray(parsed.entries)) {
      return { version: 1, entries: [] };
    }
    const entries = parsed.entries
      .filter((e) => e && typeof e.email === "string")
      .map((e) => ({
        id: typeof e.id === "string" ? e.id : crypto.randomUUID(),
        email: normalizeEmail(e.email),
        source: (e.source as EmailSource) ?? "footer",
        createdAt: typeof e.createdAt === "number" ? e.createdAt : Date.now(),
      }));
    return { version: 1, entries };
  } catch {
    return { version: 1, entries: [] };
  }
}

function writePayload(payload: Payload) {
  localStorage.setItem(EMAIL_LIST_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event(EMAIL_LIST_UPDATED_EVENT));
}

export function addEmailToList(email: string, source: EmailSource) {
  const normalized = normalizeEmail(email);
  if (!normalized) return { ok: false as const, message: "Email is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false as const, message: "Enter a valid email address." };
  }

  const payload = readPayload();
  const exists = payload.entries.some((e) => e.email === normalized);
  const nextEntries = exists
    ? payload.entries.map((e) =>
        e.email === normalized ? { ...e, source, createdAt: e.createdAt } : e,
      )
    : [
        {
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? (crypto.randomUUID as () => string)()
              : Math.random().toString(16).slice(2),
          email: normalized,
          source,
          createdAt: Date.now(),
        },
        ...payload.entries,
      ];

  writePayload({ version: 1, entries: nextEntries });
  return { ok: true as const };
}

export function getEmailList(): EmailEntry[] {
  return readPayload().entries;
}

export function exportEmailListAsCsv(entries: EmailEntry[]) {
  const header = ["email", "date", "source"].join(",");
  const rows = entries.map((e) => {
    const date = new Date(e.createdAt).toISOString();
    const email = `"${e.email.replaceAll('"', '""')}"`;
    const source = `"${e.source}"`;
    return [email, `"${date}"`, source].join(",");
  });
  return [header, ...rows].join("\n");
}

export function useEmailList() {
  const [entries, setEntries] = useState<EmailEntry[]>(() => {
    if (typeof window === "undefined") return [];
    return getEmailList();
  });

  const refresh = useCallback(() => {
    setEntries(getEmailList());
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== EMAIL_LIST_STORAGE_KEY) return;
      refresh();
    };
    const onCustom = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener(EMAIL_LIST_UPDATED_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(EMAIL_LIST_UPDATED_EVENT, onCustom);
    };
  }, [refresh]);

  const downloadCsv = useCallback(() => {
    const csv = exportEmailListAsCsv(entries);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bellehairs-email-list-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [entries]);

  const add = useCallback((email: string, source: EmailSource) => {
    return addEmailToList(email, source);
  }, []);

  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => b.createdAt - a.createdAt);
  }, [entries]);

  return { entries: sorted, add, downloadCsv, refresh };
}

