"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart, cartCount, cartTotal } from "@/lib/cart";
import { taka } from "@/lib/format";
import { BagIcon } from "./Icons";

export default function CartButton({ compact = false }: { compact?: boolean }) {
  const items = useCart((s) => s.items);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const count = ready ? cartCount(items) : 0;
  const total = ready ? cartTotal(items) : 0;

  return (
    <Link href="/cart" className="flex items-center gap-2 text-sm" aria-label="কার্ট">
      <style>{`
        @keyframes cartColorPulse {
          0%   { color: #f57c00; }
          25%  { color: #e53935; }
          50%  { color: #1565c0; }
          75%  { color: #43a047; }
          100% { color: #f57c00; }
        }
        @keyframes cartScale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes priceColorPulse {
          0%   { color: #f57c00; }
          25%  { color: #e53935; }
          50%  { color: #1565c0; }
          75%  { color: #43a047; }
          100% { color: #f57c00; }
        }
        .cart-icon-anim {
          animation: cartColorPulse 2.5s ease-in-out infinite, cartScale 1.2s ease-in-out infinite;
          display: inline-block;
        }
        .cart-price-anim {
          animation: priceColorPulse 2.5s ease-in-out infinite;
        }
      `}</style>
      <span data-cart-target className="relative inline-block">
      <span className="relative cart-icon-anim">
        <BagIcon />
        <span className="absolute -top-1 -right-1.5 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-sale px-1 text-[9px] leading-none font-bold text-white">
          {count}
        </span>
      </span>
      </span>
      {!compact && (
        <span className="text-[13px] font-bold cart-price-anim">
          {taka(total)}
        </span>
      )}
    </Link>
  );
}
