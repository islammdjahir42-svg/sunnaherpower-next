"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import type { CartItem } from "@/lib/types";
import { CartIcon } from "./Icons";
import { flyToCart } from "@/lib/flyToCart";
import { trackAddToCart } from "@/lib/fb";

type Props = { product: Omit<CartItem, "qty">; disabled?: boolean; showQty?: boolean; animated?: boolean; category?: string };

export default function OrderRow({ product, disabled, showQty = false, animated = false, category }: Props) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  const [qty, setQty] = useState(1);

  if (disabled) {
    return <span className="rounded-md bg-black/5 px-6 py-3 text-sm text-muted">স্টকে নেই</span>;
  }

  return (
    <div className="flex items-center gap-3">
      {showQty && (
        <div className="flex h-9 items-center border border-line">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-full w-8 text-muted" aria-label="কমান">-</button>
          <span className="w-8 text-center text-sm">{qty}</span>
          <button onClick={() => setQty((q) => q + 1)} className="h-full w-8 text-muted" aria-label="বাড়ান">+</button>
        </div>
      )}
      <button
        onClick={async (e) => {
          await flyToCart(e.currentTarget, product.image);
          add(product, qty);
          trackAddToCart({ id: product.id, name: product.name, price: product.price, category }, qty);
          window.location.href = "/checkout";
        }}
        className={`inline-flex h-10 items-center gap-2 rounded-md px-8 text-sm font-semibold text-white hover:opacity-90 ${animated ? "btn-animated" : "bg-accent hover:bg-accent-dark"}`}
      >
        <CartIcon /> অর্ডার করুন
      </button>
    </div>
  );
}
