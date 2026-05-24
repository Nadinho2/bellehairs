import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BannerSlideRow, ProductRow, ReviewRow, SocialFeedRow } from "@/lib/supabase/types";

export async function fetchActiveBannerSlides(): Promise<BannerSlideRow[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("banner_slides")
    .select("*")
    .eq("is_active", true)
    .order("slide_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as BannerSlideRow[];
}

export async function fetchHomepageProducts() {
  const supabase = createSupabaseServerClient();

  const [newest, best, featured] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }).limit(8),
    supabase.from("products").select("*").eq("is_best_seller", true).order("created_at", { ascending: false }).limit(8),
    supabase.from("products").select("*").eq("is_featured", true).order("created_at", { ascending: false }).limit(6),
  ]);

  if (newest.error) throw new Error(newest.error.message);
  if (best.error) throw new Error(best.error.message);
  if (featured.error) throw new Error(featured.error.message);

  return {
    newArrivals: (newest.data ?? []) as ProductRow[],
    bestSellers: (best.data ?? []) as ProductRow[],
    featured: (featured.data ?? []) as ProductRow[],
  };
}

export async function fetchSocialFeed(): Promise<SocialFeedRow[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("social_feed")
    .select("*")
    .order("slot_number", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as SocialFeedRow[];
}

export async function fetchAllProducts(): Promise<ProductRow[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductRow[];
}

export async function fetchProductById(id: string): Promise<ProductRow | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as ProductRow | null;
}

export async function fetchVisibleReviewsByProductId(productId: string): Promise<ReviewRow[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .eq("is_visible", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ReviewRow[];
}
