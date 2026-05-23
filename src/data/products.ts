import type { Product, ProductCategory } from "@/types/product";

export const categories: ProductCategory[] = [
  "Wigs",
  "Bundles",
  "Closures",
  "Frontals",
  "Accessories",
];

export const products: Product[] = [
  {
    id: "bh-raw-bone-straight-wig",
    name: "Raw Bone Straight Wig",
    category: "Wigs",
    price: 185000,
    variants: [
      { lengthInches: 14, price: 185000 },
      { lengthInches: 18, price: 205000 },
      { lengthInches: 22, price: 230000 },
      { lengthInches: 26, price: 260000 },
    ],
    description:
      "A sleek, luxurious bone-straight finish with a natural-looking hairline. Perfect for clean everyday glam and polished looks.",
    image:
      "https://images.unsplash.com/photo-1541269620759-5c594a1c43c5?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1541269620759-5c594a1c43c5?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=80",
    ],
    hairType: "Vietnamese Hair",
    texture: "Straight",
    inStock: true,
    isBestSeller: true,
    isFeatured: true,
    createdAt: 1735689600000,
    updatedAt: 1735689600000,
  },
  {
    id: "bh-hd-body-wave-wig",
    name: "HD Body Wave Wig",
    category: "Wigs",
    price: 165000,
    variants: [
      { lengthInches: 14, price: 165000 },
      { lengthInches: 18, price: 185000 },
      { lengthInches: 22, price: 210000 },
      { lengthInches: 26, price: 245000 },
    ],
    description:
      "Soft, bouncy waves with an ultra-natural HD lace finish. Style it sleek, wet look, or full volume — it holds beautifully.",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1520975682030-3bc4d11e9136?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1520975682030-3bc4d11e9136?auto=format&fit=crop&w=1400&q=80",
    ],
    hairType: "Human Hair",
    texture: "Wavy",
    inStock: true,
    isBestSeller: true,
    isFeatured: false,
    createdAt: 1735776000000,
    updatedAt: 1735776000000,
  },
  {
    id: "bh-deep-wave-wig",
    name: "Deep Wave Wig",
    category: "Wigs",
    price: 175000,
    variants: [
      { lengthInches: 14, price: 175000 },
      { lengthInches: 18, price: 195000 },
      { lengthInches: 22, price: 225000 },
      { lengthInches: 26, price: 255000 },
    ],
    description:
      "Defined, glossy curls with a soft, luxurious feel. Ideal for bold feminine looks and effortless vacation glam.",
    image:
      "https://images.unsplash.com/photo-1520975682030-3bc4d11e9136?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1520975682030-3bc4d11e9136?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1520975682030-3bc4d11e9136?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=80",
    ],
    hairType: "Human Hair",
    texture: "Curly",
    inStock: true,
    isBestSeller: false,
    isFeatured: true,
    createdAt: 1735862400000,
    updatedAt: 1735862400000,
  },
  {
    id: "bh-bob-frontal-wig",
    name: "Frontal Bob Wig",
    category: "Wigs",
    price: 120000,
    variants: [
      { lengthInches: 10, price: 120000 },
      { lengthInches: 12, price: 130000 },
      { lengthInches: 14, price: 145000 },
    ],
    description:
      "A classic bob with frontal coverage for the most natural finish. Perfect for clean office looks or a bold dinner slay.",
    image:
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=80",
    ],
    hairType: "Blend Hair",
    texture: "Straight",
    inStock: true,
    isBestSeller: false,
    isFeatured: false,
    createdAt: 1735948800000,
    updatedAt: 1735948800000,
  },
  {
    id: "bh-bone-straight-bundle",
    name: "Bone Straight Bundle",
    category: "Bundles",
    price: 65000,
    variants: [
      { lengthInches: 12, price: 65000 },
      { lengthInches: 14, price: 70000 },
      { lengthInches: 16, price: 76000 },
      { lengthInches: 18, price: 82000 },
      { lengthInches: 20, price: 90000 },
      { lengthInches: 22, price: 98000 },
      { lengthInches: 24, price: 108000 },
    ],
    description:
      "Silky straight bundles with a smooth finish and minimal shedding. Great for sleek installs and long-lasting wear.",
    image:
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1400&q=80",
    ],
    hairType: "Vietnamese Hair",
    texture: "Straight",
    inStock: true,
    isBestSeller: true,
    isFeatured: false,
    createdAt: 1736035200000,
    updatedAt: 1736035200000,
  },
  {
    id: "bh-body-wave-bundle",
    name: "Body Wave Bundle",
    category: "Bundles",
    price: 62000,
    variants: [
      { lengthInches: 12, price: 62000 },
      { lengthInches: 14, price: 68000 },
      { lengthInches: 16, price: 74000 },
      { lengthInches: 18, price: 80000 },
      { lengthInches: 20, price: 88000 },
      { lengthInches: 22, price: 96000 },
      { lengthInches: 24, price: 106000 },
    ],
    description:
      "Soft, fluffy body wave bundles with natural bounce. Easy to style, easy to maintain, and always feminine.",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf6?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf6?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf6?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf6?auto=format&fit=crop&w=1400&q=80",
    ],
    hairType: "Human Hair",
    texture: "Wavy",
    inStock: true,
    isBestSeller: false,
    isFeatured: false,
    createdAt: 1736121600000,
    updatedAt: 1736121600000,
  },
  {
    id: "bh-deep-wave-bundle",
    name: "Deep Wave Bundle",
    category: "Bundles",
    price: 64000,
    variants: [
      { lengthInches: 12, price: 64000 },
      { lengthInches: 14, price: 70000 },
      { lengthInches: 16, price: 76000 },
      { lengthInches: 18, price: 82000 },
      { lengthInches: 20, price: 90000 },
      { lengthInches: 22, price: 99000 },
      { lengthInches: 24, price: 110000 },
    ],
    description:
      "Tight, defined deep wave bundles that keep their curl pattern. Designed for that rich, luxurious full look.",
    image:
      "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&w=1400&q=80",
    ],
    hairType: "Human Hair",
    texture: "Curly",
    inStock: true,
    isBestSeller: true,
    isFeatured: false,
    createdAt: 1736208000000,
    updatedAt: 1736208000000,
  },
  {
    id: "bh-curly-bundle",
    name: "Curly Bundle",
    category: "Bundles",
    price: 68000,
    variants: [
      { lengthInches: 12, price: 68000 },
      { lengthInches: 14, price: 74000 },
      { lengthInches: 16, price: 81000 },
      { lengthInches: 18, price: 89000 },
      { lengthInches: 20, price: 98000 },
      { lengthInches: 22, price: 108000 },
      { lengthInches: 24, price: 120000 },
    ],
    description:
      "Soft, voluminous curls for that full glam finish. Perfect for standout installs and events.",
    image:
      "https://images.unsplash.com/photo-1485290334039-a3c69043e517?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1485290334039-a3c69043e517?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1485290334039-a3c69043e517?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1485290334039-a3c69043e517?auto=format&fit=crop&w=1400&q=80",
    ],
    hairType: "Blend Hair",
    texture: "Curly",
    inStock: true,
    isBestSeller: false,
    isFeatured: false,
    createdAt: 1736294400000,
    updatedAt: 1736294400000,
  },
  {
    id: "bh-hd-closure-4x4",
    name: "HD Lace Closure (4x4)",
    category: "Closures",
    price: 45000,
    variants: [
      { lengthInches: 12, price: 45000 },
      { lengthInches: 14, price: 48000 },
      { lengthInches: 16, price: 52000 },
      { lengthInches: 18, price: 56000 },
      { lengthInches: 20, price: 60000 },
    ],
    description:
      "Ultra-thin HD lace closure for the most natural scalp illusion. Blends perfectly and gives a clean finish.",
    image:
      "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1400&q=80",
    ],
    hairType: "Human Hair",
    texture: "Straight",
    inStock: true,
    isBestSeller: false,
    isFeatured: false,
    createdAt: 1736380800000,
    updatedAt: 1736380800000,
  },
  {
    id: "bh-silk-base-closure-5x5",
    name: "Silk Base Closure (5x5)",
    category: "Closures",
    price: 60000,
    variants: [
      { lengthInches: 12, price: 60000 },
      { lengthInches: 14, price: 65000 },
      { lengthInches: 16, price: 70000 },
      { lengthInches: 18, price: 75000 },
      { lengthInches: 20, price: 80000 },
    ],
    description:
      "Silk base closure for a flawless, scalp-like finish. Ideal for sleek middle parts and premium installs.",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1400&q=80",
    ],
    hairType: "Vietnamese Hair",
    texture: "Straight",
    inStock: true,
    isBestSeller: false,
    isFeatured: false,
    createdAt: 1736467200000,
    updatedAt: 1736467200000,
  },
  {
    id: "bh-hd-frontal-13x4",
    name: "HD Lace Frontal (13x4)",
    category: "Frontals",
    price: 95000,
    variants: [
      { lengthInches: 14, price: 95000 },
      { lengthInches: 16, price: 102000 },
      { lengthInches: 18, price: 112000 },
      { lengthInches: 20, price: 122000 },
    ],
    description:
      "HD lace frontal for a seamless hairline and versatile styling. Wear it up, side part, or sleek back.",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1400&q=80",
    ],
    hairType: "Human Hair",
    texture: "Straight",
    inStock: true,
    isBestSeller: true,
    isFeatured: true,
    createdAt: 1736553600000,
    updatedAt: 1736553600000,
  },
  {
    id: "bh-transparent-frontal-13x6",
    name: "Transparent Lace Frontal (13x6)",
    category: "Frontals",
    price: 125000,
    variants: [
      { lengthInches: 14, price: 125000 },
      { lengthInches: 16, price: 135000 },
      { lengthInches: 18, price: 145000 },
      { lengthInches: 20, price: 160000 },
    ],
    description:
      "Wide lace frontal coverage with a natural melt. Gives more space for styling and a smoother, fuller finish.",
    image:
      "https://images.unsplash.com/photo-1520975589174-5a5b4ff62f9a?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1520975589174-5a5b4ff62f9a?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1520975589174-5a5b4ff62f9a?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1520975589174-5a5b4ff62f9a?auto=format&fit=crop&w=1400&q=80",
    ],
    hairType: "Vietnamese Hair",
    texture: "Straight",
    inStock: true,
    isBestSeller: false,
    isFeatured: false,
    createdAt: 1736640000000,
    updatedAt: 1736640000000,
  },
];

export function getProductById(id: string) {
  return products.find((p) => p.id === id);
}

export const productsById = products.reduce<Record<string, Product>>(
  (acc, product) => {
    acc[product.id] = product;
    return acc;
  },
  {},
);
