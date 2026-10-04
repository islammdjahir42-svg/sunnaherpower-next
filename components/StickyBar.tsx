"use client";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
const tk = (n: number) => `৳${n.toLocaleString("en-US")}`;
import { CartIcon } from "./Icons";
import { flyToCart } from "@/lib/flyToCart";
import type { CartItem } from "@/lib/types";

type Props = {
  product: Omit<CartItem, "qty">;
  name: string;
  price: number;
  regular: number;
  discount: number;
  disabled?: boolean;
};

export default function StickyBar({ product, name, price, regular, discount, disabled }: Props) {
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (disabled) return null;

  return (
    <>
      <div style={{ height: "0px" }} aria-hidden />

      {visible && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
          <div className="mx-auto max-w-[600px] px-3 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] md:flex md:max-w-[1224px] md:items-center md:gap-4 md:py-3">
            <div className="flex items-start gap-3 md:min-w-0 md:flex-1 md:items-center">
              {product.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image} alt="" className="mt-1 h-14 w-14 shrink-0 object-contain md:mt-0 md:h-12 md:w-12" />
              )}
              <p className="line-clamp-2 min-w-0 flex-1 text-[19px] leading-8 md:line-clamp-1 text-[#555]">{name}</p>
              <div className="shrink-0 text-right text-[19px] leading-8 md:flex md:items-baseline md:gap-1.5">
                {discount > 0 && <del className="block text-[#e4531c] md:inline">{tk(regular)}</del>}
                <span className="block font-bold text-[#1f9d24] md:inline">{tk(price)}</span>
              </div>
            </div>

            <div className="mt-3 flex shrink-0 items-center justify-center gap-2 md:mt-0">
              <div className="flex h-10 items-center border border-line text-sm">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-full w-7 text-[#333]" aria-label="কমান">-</button>
                <span className="w-9 border-x border-line text-center leading-10">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="h-full w-7 text-[#333]" aria-label="বাড়ান">+</button>
              </div>
              <button
                onClick={async (e) => { await flyToCart(e.currentTarget, product.image); add(product, qty); window.location.href = "/checkout"; }}
                className="inline-flex h-10 items-center gap-1.5 bg-accent px-5 text-[15px] font-bold text-white hover:bg-accent-dark"
              >
                <CartIcon /> অর্ডার করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
