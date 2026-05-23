"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export const WISHLIST_STORAGE_KEY = "bellehairs.wishlist.v1";
export const WISHLIST_UPDATED_EVENT = "bellehairs.wishlist.updated";

type Payload = {
  version: 1;
  ids: string[];
};

function readWishlist(): string[] {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Payload;
    if (parsed?.version !== 1) return [];
    if (!Array.isArray(parsed.ids)) return [];
    return parsed.ids.filter((id) => typeof id === "string");
  } catch {
    return [];
  }
}

function writeWishlist(ids: string[]) {
  const payload: Payload = { version: 1, ids };
  localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT));
}

export function useWishlist() {
  const [ids, setIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    return readWishlist();
  });

  const refresh = useCallback(() => {
    setIds(readWishlist());
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== WISHLIST_STORAGE_KEY) return;
      refresh();
    };
    const onCustom = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener(WISHLIST_UPDATED_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(WISHLIST_UPDATED_EVENT, onCustom);
    };
  }, [refresh]);

  const has = useCallback(
    (id: string) => {
      return ids.includes(id);
    },
    [ids],
  );

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeWishlist(next);
      return next;
    });
  }, []);

  const count = useMemo(() => ids.length, [ids]);

  return { ids, has, toggle, count };
}

