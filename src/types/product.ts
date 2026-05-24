export type ProductCategory =
  | "Wigs"
  | "Weavon"
  | "Bundles"
  | "Closures"
  | "Frontals"
  | "Accessories";

export type HairType = "Human Hair" | "Vietnamese Hair" | "Blend Hair";

export type ProductVariant = {
  lengthInches: number;
  price: number;
};

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  variants?: ProductVariant[];
  lengths?: string[];
  hairType?: HairType;
  texture?: string;
  closureType?: string;
  accessoryType?: string;
  inStock?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  createdAt?: number;
  updatedAt?: number;
  description: string;
  image: string;
  images?: string[];
};
