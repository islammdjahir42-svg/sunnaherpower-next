"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { slug: string; name: string };

export default function MobileTabs({ items }: { items: Item[] }) {
  const pathname = usePathname();
  const cls = (active: boolean) =>
    active
      ? "block shrink-0 border-b-2 border-white px-4 py-[6px] text-[13px] font-bold text-white"
      : "block shrink-0 px-4 py-[6px] text-[13px] font-bold text-white/80 hover:text-white";
  return (
    <ul className="flex gap-1 whitespace-nowrap">
      <li><Link href="/" className={cls(pathname === "/")}>Home</Link></li>
      {items.map((c) => (
        <li key={c.slug}>
          <Link href={`/product-category/${c.slug}`} className={cls(pathname === `/product-category/${c.slug}`)}>
            {c.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
