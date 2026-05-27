import ProductDetailClient from "@/components/ProductDetailClient";
import { mapProductRowToProduct } from "@/lib/supabase/mappers";
import { fetchAccessoryProducts, fetchProductById, fetchRelatedHairProducts, fetchVisibleReviewsByProductId } from "@/lib/supabase/queries";

const HAIR_CATEGORIES = ["Wigs", "Weavon", "Bundles", "Closures", "Frontals"];

export default async function ProductPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [row, reviews] = await Promise.all([
    fetchProductById(id).catch(() => null),
    fetchVisibleReviewsByProductId(id).catch(() => []),
  ]);
  const product = row ? mapProductRowToProduct(row) : null;

  let relatedProducts: ReturnType<typeof mapProductRowToProduct>[] = [];
  let accessoryProducts: ReturnType<typeof mapProductRowToProduct>[] = [];

  if (product) {
    const isHair = HAIR_CATEGORIES.includes(product.category);
    if (isHair) {
      const [relatedRows, accessoryRows] = await Promise.all([
        fetchRelatedHairProducts(product.category, product.id).catch(() => []),
        fetchAccessoryProducts(4).catch(() => []),
      ]);
      relatedProducts = relatedRows.map(mapProductRowToProduct);
      accessoryProducts = accessoryRows.map(mapProductRowToProduct);
    } else {
      const accessoryRows = await fetchAccessoryProducts(4).catch(() => []);
      accessoryProducts = accessoryRows.filter((r) => r.id !== product.id).map(mapProductRowToProduct);
    }
  }

  return (
    <ProductDetailClient
      product={product}
      reviews={reviews}
      relatedProducts={relatedProducts}
      accessoryProducts={accessoryProducts}
    />
  );
}
