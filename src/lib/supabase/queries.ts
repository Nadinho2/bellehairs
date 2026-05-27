import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  HomepageHeroGridRow,
  HomepageCategoryCardRow,
  ProductRow,
  ReviewRow,
  SocialFeedRow,
} from "@/lib/supabase/types";

export async function fetchHomepageProducts() {
  const supabase = await createSupabaseServerClient();

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
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("social_feed")
    .select("*")
    .order("slot_number", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as SocialFeedRow[];
}

export async function fetchHomepageCategoryCards(): Promise<HomepageCategoryCardRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("homepage_category_cards").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []) as HomepageCategoryCardRow[];
}

export async function fetchHomepageHeroGrid(): Promise<HomepageHeroGridRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("homepage_hero_grid").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []) as HomepageHeroGridRow[];
}

export async function fetchAllProducts(): Promise<ProductRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductRow[];
}

export async function fetchProductsByIds(ids: string[]): Promise<ProductRow[]> {
  const unique = Array.from(new Set(ids.map((x) => String(x).trim()).filter(Boolean)));
  if (!unique.length) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("products").select("*").in("id", unique).limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductRow[];
}

export async function fetchProductById(id: string): Promise<ProductRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as ProductRow | null;
}

export async function fetchVisibleReviewsByProductId(productId: string): Promise<ReviewRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .eq("is_visible", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ReviewRow[];
}

export async function fetchAccessoryProducts(limit = 4): Promise<ProductRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", "Accessories")
    .eq("in_stock", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductRow[];
}

export async function fetchRelatedHairProducts(category: string, excludeId: string, limit = 4): Promise<ProductRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", category)
    .neq("id", excludeId)
    .eq("in_stock", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductRow[];
}
