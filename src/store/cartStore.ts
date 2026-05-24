import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  productId: string;
  variantLengthInches?: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (productId: string, variantLengthInches?: number) => void;
  removeItem: (itemId: string) => void;
  setQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
};

function toItemId(productId: string, variantLengthInches?: number) {
  return `${productId}:${variantLengthInches ?? "base"}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (productId, variantLengthInches) =>
        set((state) => {
          const id = toItemId(productId, variantLengthInches);
          const existing = state.items.find((i) => i.id === id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === id ? { ...i, quantity: i.quantity + 1 } : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { id, productId, variantLengthInches, quantity: 1 },
            ],
          };
        }),
      removeItem: (itemId) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
        })),
      setQuantity: (itemId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== itemId)
              : state.items.map((i) =>
                  i.id === itemId ? { ...i, quantity } : i,
                ),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "bellehairs.cart.v1",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export const selectCartCount = (items: CartItem[]) =>
  items.reduce((acc, item) => acc + item.quantity, 0);
