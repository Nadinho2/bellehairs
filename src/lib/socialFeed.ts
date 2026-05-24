"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export const SOCIAL_FEED_STORAGE_KEY = "bellehairs.socialFeed.v1";
export const SOCIAL_FEED_UPDATED_EVENT = "bellehairs.socialFeed.updated";

export type SocialFeedPayload = {
  version: 1;
  images: (string | null)[];
};

export function loadSocialFeed(): (string | null)[] {
  try {
    const raw = localStorage.getItem(SOCIAL_FEED_STORAGE_KEY);
    if (!raw) return Array.from({ length: 6 }).map(() => null);
    const parsed = JSON.parse(raw) as SocialFeedPayload;
    if (parsed?.version !== 1) return Array.from({ length: 6 }).map(() => null);
    const images = Array.isArray(parsed.images) ? parsed.images : [];
    const normalized = images
      .slice(0, 6)
      .map((v) => (typeof v === "string" && v.length ? v : null));
    while (normalized.length < 6) normalized.push(null);
    return normalized;
  } catch {
    return Array.from({ length: 6 }).map(() => null);
  }
}

export function saveSocialFeed(images: (string | null)[]) {
  const payload: SocialFeedPayload = { version: 1, images: images.slice(0, 6) };
  localStorage.setItem(SOCIAL_FEED_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event(SOCIAL_FEED_UPDATED_EVENT));
}

export function useSocialFeed() {
  const [images, setImages] = useState<(string | null)[]>(() => {
    if (typeof window === "undefined") return Array.from({ length: 6 }).map(() => null);
    return loadSocialFeed();
  });

  const refresh = useCallback(() => {
    setImages(loadSocialFeed());
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== SOCIAL_FEED_STORAGE_KEY) return;
      refresh();
    };
    const onCustom = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener(SOCIAL_FEED_UPDATED_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SOCIAL_FEED_UPDATED_EVENT, onCustom);
    };
  }, [refresh]);

  const setSlot = useCallback((index: number, dataUrl: string | null) => {
    setImages((prev) => {
      const next = prev.slice(0, 6);
      while (next.length < 6) next.push(null);
      next[index] = dataUrl;
      saveSocialFeed(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    const next = Array.from({ length: 6 }).map(() => null);
    setImages(next);
    saveSocialFeed(next);
  }, []);

  const hasAny = useMemo(() => images.some(Boolean), [images]);

  return { images, setSlot, clearAll, hasAny };
}

