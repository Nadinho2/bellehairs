import ProductsClient from "@/app/products/products-client";
import { mapProductRowToProduct } from "@/lib/supabase/mappers";
import { fetchAllProducts } from "@/lib/supabase/queries";

export default async function ProductsPage() {
  const rows = await fetchAllProducts().catch(() => []);
  const products = rows.map(mapProductRowToProduct);
  return <ProductsClient products={products} />;
}
