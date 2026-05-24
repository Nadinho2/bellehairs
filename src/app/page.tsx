import HomeClient, { type HomeSlide } from "@/components/HomeClient";
import { mapProductRowToProduct } from "@/lib/supabase/mappers";
import {
  fetchActiveBannerSlides,
  fetchHomepageProducts,
  fetchSocialFeed,
} from "@/lib/supabase/queries";

export default async function Home() {
  const [bannerRows, homeProducts, socialRows] = await Promise.all([
    fetchActiveBannerSlides().catch(() => []),
    fetchHomepageProducts().catch(() => ({
      newArrivals: [],
      bestSellers: [],
      featured: [],
    })),
    fetchSocialFeed().catch(() => []),
  ]);

  const slides: HomeSlide[] = bannerRows.map((s) => ({
    title: s.heading,
    cta: s.cta_label ?? "Shop Now",
    href: s.cta_link ?? "/products",
    image: s.image_url,
  }));

  const socialImages: (string | null)[] = Array.from({ length: 6 }).map(() => null);
  for (const row of socialRows) {
    const idx = (row.slot_number ?? 0) - 1;
    if (idx >= 0 && idx < 6) socialImages[idx] = row.image_url;
  }

  return (
    <HomeClient
      slides={slides}
      newArrivals={homeProducts.newArrivals.map(mapProductRowToProduct)}
      bestSellers={homeProducts.bestSellers.map(mapProductRowToProduct)}
      featured={homeProducts.featured.map(mapProductRowToProduct)}
      socialImages={socialImages}
    />
  );
}

