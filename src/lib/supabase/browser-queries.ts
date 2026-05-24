"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProductRow } from "@/lib/supabase/types";

export async function fetchProductsByIds(ids: string[]): Promise<ProductRow[]> {
  if (ids.length === 0) return [];
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from("products").select("*").in("id", ids);
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductRow[];
}

