"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "bellehairs.adminSession.v1";

type Session = {
  username: string;
  expiresAt: number;
};

function getEnvCredentials() {
  const username = process.env.NEXT_PUBLIC_ADMIN_USERNAME || "admin";
  const password = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "bellehairs";
  return { username, password };
}

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.username || typeof parsed.expiresAt !== "number") return null;
    if (Date.now() > parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(session: Session | null) {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function useAdminAuth() {
  const [session, setSession] = useState<Session | null>(() => {
    if (typeof window === "undefined") return null;
    return readSession();
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setSession(readSession());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isAuthed = Boolean(session);

  const login = useCallback((username: string, password: string) => {
    const creds = getEnvCredentials();
    const ok =
      username.trim().toLowerCase() === creds.username.trim().toLowerCase() &&
      password === creds.password;

    if (!ok) return { ok: false as const, message: "Invalid username or password." };

    const next: Session = {
      username: creds.username,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    };
    writeSession(next);
    setSession(next);
    return { ok: true as const };
  }, []);

  const logout = useCallback(() => {
    writeSession(null);
    setSession(null);
  }, []);

  const username = useMemo(() => session?.username ?? null, [session]);

  return { isAuthed, username, login, logout };
}

