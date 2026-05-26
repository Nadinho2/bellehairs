import type { Product } from "@/types/product";
import type { ProductRow } from "@/lib/supabase/types";

function parseLengthToNumber(v: string) {
  const digits = v.replace(/[^\d]/g, "");
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function mapProductRowToProduct(row: ProductRow): Product {
  const images = row.images?.filter(Boolean) ?? [];
  const lengths = row.lengths?.filter(Boolean) ?? [];
  const lengthPrices = row.length_prices ?? null;
  const lengthNumbers = lengths
    .map((l) => parseLengthToNumber(l))
    .filter((n): n is number => typeof n === "number");

  const variants =
    lengthNumbers.length > 0
      ? lengthNumbers.map((lengthInches) => {
          const key = `${lengthInches}"`;
          const priceFromMap = lengthPrices?.[key] ?? null;
          return {
            lengthInches,
            price:
              typeof priceFromMap === "number" && Number.isFinite(priceFromMap) && priceFromMap > 0
                ? priceFromMap
                : Number(row.price),
          };
        })
      : undefined;

  return {
    id: row.id,
    name: row.name,
    category: row.category as Product["category"],
    price: Number(row.price),
    variants,
    lengths: lengths.length ? lengths : undefined,
    hairType: row.hair_type ?? undefined,
    texture: row.texture ?? undefined,
    closureType: row.closure_type ?? undefined,
    accessoryType: row.accessory_type ?? undefined,
    inStock: row.in_stock !== false,
    isNewArrival: row.is_new_arrival === true,
    isBestSeller: row.is_best_seller === true,
    isFeatured: row.is_featured === true,
    createdAt: new Date(row.created_at).getTime(),
    description: row.description ?? "",
    image: images[0] ?? "",
    images,
  };
}
