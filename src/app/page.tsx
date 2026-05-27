import HomeClient from "@/components/HomeClient";
import { mapProductRowToProduct } from "@/lib/supabase/mappers";
import {
  fetchHomepageCategoryCards,
  fetchHomepageHeroGrid,
  fetchHomepageProducts,
  fetchProductsByIds,
  fetchSocialFeed,
} from "@/lib/supabase/queries";
import type { DbProductCategory } from "@/lib/supabase/types";

export default async function Home() {
  const [homeProducts, socialRows, categoryRows, heroRows] = await Promise.all([
    fetchHomepageProducts().catch(() => ({
      newArrivals: [],
      bestSellers: [],
      featured: [],
    })),
    fetchSocialFeed().catch(() => []),
    fetchHomepageCategoryCards().catch(() => []),
    fetchHomepageHeroGrid().catch(() => []),
  ]);

  const heroBySlot = new Map<string, string | null>();
  for (const row of heroRows) heroBySlot.set(String(row.slot), (row.product_id as string | null) ?? null);

  const slots = ["slot_1", "slot_2", "slot_3", "slot_4", "slot_5"] as const;
  const heroIds = slots.map((s) => heroBySlot.get(s)).filter(Boolean) as string[];
  const heroProducts = await fetchProductsByIds(heroIds).catch(() => []);
  const heroProductById = new Map(heroProducts.map((p) => [p.id, mapProductRowToProduct(p)] as const));
  const heroGrid = slots.map((slot) => ({
    slot,
    product: heroBySlot.get(slot) ? (heroProductById.get(heroBySlot.get(slot) as string) ?? null) : null,
  }));

  const socialImages: (string | null)[] = Array.from({ length: 6 }).map(() => null);
  for (const row of socialRows) {
    const idx = (row.slot_number ?? 0) - 1;
    if (idx >= 0 && idx < 6) socialImages[idx] = row.image_url;
  }

  const categoryCardImages: Record<DbProductCategory, string | null> = {
    Wigs: null,
    Weavon: null,
    Accessories: null,
  };
  for (const row of categoryRows) {
    const cat = row.category as DbProductCategory;
    if (cat in categoryCardImages) categoryCardImages[cat] = row.image_url;
  }

  return (
    <HomeClient
      heroGrid={heroGrid}
      newArrivals={homeProducts.newArrivals.map(mapProductRowToProduct)}
      bestSellers={homeProducts.bestSellers.map(mapProductRowToProduct)}
      featured={homeProducts.featured.map(mapProductRowToProduct)}
      socialImages={socialImages}
      categoryCardImages={categoryCardImages}
    />
  );
}
