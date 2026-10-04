"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SearchIcon } from "./Icons";

type Item = { slug: string; name: string };

export default function MobileMenu({ menu, categories }: { menu: Item[]; categories: Item[] }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"menu" | "cats">("menu");
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  const list = tab === "menu" ? [{ slug: "", name: "Home" }, ...menu] : categories;
  const row = "block border-b border-line px-5 py-[15px] text-[13px] font-bold uppercase text-[#333]";

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 text-sm font-semibold" aria-label="মেনু খুলুন">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
          <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
        </svg>
        MENU
      </button>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-label="মেনু বন্ধ করুন" />
          <nav className="absolute inset-y-0 left-0 w-[300px] max-w-[85%] overflow-y-auto bg-white shadow-xl">
            <form action="/shop" className="relative border-b border-line">
              <input
                name="q"
                type="search"
                placeholder="Search for products"
                className="w-full py-6 pr-12 pl-5 text-sm font-semibold placeholder:text-[#777] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              <button className="absolute inset-y-0 right-0 grid w-12 place-items-center text-[#555]" aria-label="খুঁজুন">
                <SearchIcon className="h-[22px] w-[22px]" />
              </button>
            </form>
            <div className="grid grid-cols-2 text-[13px] font-bold uppercase">
              {(
                [
                  ["menu", "Menu"],
                  ["cats", "Categories"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`border-b-2 py-4 ${tab === key ? "border-sale bg-[#ebebeb] text-[#333]" : "border-transparent bg-[#f7f7f7] text-[#888]"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <ul>
              {list.map((c) => (
                <li key={c.slug || "home"}>
                  <Link href={c.slug ? `/product-category/${c.slug}` : "/"} className={row}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
