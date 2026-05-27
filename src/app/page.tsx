import HomeClient from "@/components/HomeClient";
import { mapProductRowToProduct } from "@/lib/supabase/mappers";
import {
  fetchHomepageCategoryCards,
  fetchHomepageProducts,
  fetchSocialFeed,
} from "@/lib/supabase/queries";
import type { DbProductCategory } from "@/lib/supabase/types";

export default async function Home() {
  const [homeProducts, socialRows, categoryRows] = await Promise.all([
    fetchHomepageProducts().catch(() => ({
      newArrivals: [],
      bestSellers: [],
      featured: [],
    })),
    fetchSocialFeed().catch(() => []),
    fetchHomepageCategoryCards().catch(() => []),
  ]);

  const socialImages: (string | null)[] = Array.from({ length: 3 }).map(() => null);
  for (const row of socialRows) {
    const idx = (row.slot_number ?? 0) - 1;
    if (idx >= 0 && idx < 3) socialImages[idx] = row.image_url;
  }

  const categoryCardImages = Object.fromEntries(
    categoryRows.map((r) => [r.category, r.image_url ?? null]),
  ) as Record<DbProductCategory, string | null>;

  return (
    <HomeClient
      newArrivals={homeProducts.newArrivals.map(mapProductRowToProduct)}
      bestSellers={homeProducts.bestSellers.map(mapProductRowToProduct)}
      featured={homeProducts.featured.map(mapProductRowToProduct)}
      socialImages={socialImages}
      categoryCardImages={categoryCardImages}
    />
  );
}
