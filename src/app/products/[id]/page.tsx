import ProductDetailClient from "@/components/ProductDetailClient";
import { mapProductRowToProduct } from "@/lib/supabase/mappers";
import { fetchProductById, fetchVisibleReviewsByProductId } from "@/lib/supabase/queries";

export default async function ProductPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [row, reviews] = await Promise.all([
    fetchProductById(id).catch(() => null),
    fetchVisibleReviewsByProductId(id).catch(() => []),
  ]);
  const product = row ? mapProductRowToProduct(row) : null;
  return <ProductDetailClient product={product} reviews={reviews} />;
}

