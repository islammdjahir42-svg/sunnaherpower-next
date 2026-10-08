"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import type { CartItem } from "@/lib/types";
import { flyToCart } from "@/lib/flyToCart";
import { trackAddToCart } from "@/lib/fb";

type Props = {
  product: Omit<CartItem, "qty">;
  disabled?: boolean;
  compact?: boolean;
  qty?: number;
  category?: string; // Facebook-এর content_category
};

export default function AddToCartButton({ product, disabled, compact, qty = 1, category }: Props) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  const [added, setAdded] = useState(false);

  if (disabled) {
    return <span className="w-full rounded-md bg-black/5 py-3 text-center text-sm text-muted">স্টকে নেই</span>;
  }

  function track() {
    trackAddToCart({ id: product.id, name: product.name, price: product.price, category }, qty);
  }

  async function addOnly(e: React.MouseEvent<HTMLButtonElement>) {
    await flyToCart(e.currentTarget, product.image);
    add(product, qty);
    track();
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  async function orderNow(e: React.MouseEvent<HTMLButtonElement>) {
    await flyToCart(e.currentTarget, product.image);
    add(product, qty);
    track();
    window.location.href = "/checkout";
  }

  if (compact) {
    return (
      <div className="flex w-full gap-2">
        <button
          onClick={orderNow}
          className="flex-1 rounded-md bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-dark"
        >
          অর্ডার করুন
        </button>
        <button
          onClick={addOnly}
          aria-label={added ? "কার্টে যোগ হয়েছে" : "কার্টে যোগ করুন"}
          title={added ? "কার্টে যোগ হয়েছে" : "কার্টে যোগ করুন"}
          className={`grid w-11 shrink-0 place-items-center rounded-md text-white transition-colors ${added ? "bg-[#1f9d24]" : "bg-accent hover:bg-accent-dark"}`}
        >
          {added ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
              <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
              <path d="M2.5 3.5h2.2l2.3 11h11l2-8H6.2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="19" r="1.4" />
              <circle cx="17" cy="19" r="1.4" />
            </svg>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button onClick={orderNow} className="flex-1 rounded-md bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-dark">
        এখনই অর্ডার করুন
      </button>
      <button onClick={addOnly} className="flex-1 rounded-md border-2 border-accent px-6 py-3 font-semibold text-accent hover:bg-accent/5">
        {added ? "কার্টে যোগ হয়েছে ✓" : "কার্টে যোগ করুন"}
      </button>
    </div>
  );
}
