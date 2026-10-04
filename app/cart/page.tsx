"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart, cartTotal } from "@/lib/cart";
import { taka } from "@/lib/format";

export default function CartPage() {
  const { items, setQty, remove } = useCart();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;

  if (!items.length) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">কার্ট খালি</h1>
        <p className="mt-2 text-muted">পছন্দের লাইট বেছে নিয়ে কার্টে যোগ করুন।</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-white">শপে যান</Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">আপনার কার্ট</h1>
      <ul className="divide-y divide-black/5 rounded-xl bg-white ring-1 ring-black/5">
        {items.map((i) => (
          <li key={i.id} className="flex items-center gap-3 p-3">
            <div className="relative h-16 w-16 shrink-0 rounded-lg bg-[#f6f6f6]">
              {i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-contain p-1" />}
            </div>
            <div className="min-w-0 flex-1">
              <Link href={`/product/${i.slug}`} className="line-clamp-2 text-sm font-medium">{i.name}</Link>
              <p className="text-sm font-bold text-sale">{taka(i.price)}</p>
            </div>
            <div className="flex items-center rounded-lg ring-1 ring-black/10">
              <button onClick={() => setQty(i.id, i.qty - 1)} className="px-3 py-1" aria-label="কমান">−</button>
              <span className="w-6 text-center text-sm">{i.qty}</span>
              <button onClick={() => setQty(i.id, i.qty + 1)} className="px-3 py-1" aria-label="বাড়ান">+</button>
            </div>
            <button onClick={() => remove(i.id)} className="px-2 text-muted hover:text-sale" aria-label="মুছুন">✕</button>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-black/5">
        <span className="font-semibold">মোট</span>
        <span className="text-xl font-bold text-sale">{taka(cartTotal(items))}</span>
      </div>
      <Link href="/checkout" className="mt-4 block rounded-lg bg-accent py-3 text-center font-semibold text-white hover:bg-accent-dark">
        চেকআউট করুন
      </Link>
    </section>
  );
}
