"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "./types";

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, qty = 1) =>
        set((s) => {
          const found = s.items.find((i) => i.id === item.id);
          if (found) {
            return { items: s.items.map((i) => (i.id === item.id ? { ...i, qty: i.qty + qty } : i)) };
          }
          return { items: [...s.items, { ...item, qty }] };
        }),
      setQty: (id, qty) =>
        set((s) => ({
          items: qty < 1 ? s.items.filter((i) => i.id !== id) : s.items.map((i) => (i.id === id ? { ...i, qty } : i)),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: "sunnaher-cart" }
  )
);

export const cartTotal = (items: CartItem[]) => items.reduce((t, i) => t + i.price * i.qty, 0);
export const cartCount = (items: CartItem[]) => items.reduce((t, i) => t + i.qty, 0);
