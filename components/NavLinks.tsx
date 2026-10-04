"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { slug: string; name: string };

export default function NavLinks({ items }: { items: Item[] }) {
  const pathname = usePathname();
  const cls = (active: boolean) =>
    `block py-[15px] pr-5 leading-5 text-white ${active ? "border-b-2 border-white font-bold" : "hover:text-white/80"}`;
  return (
    <>
      <li><Link href="/" className={cls(pathname === "/")}>Home</Link></li>
      {items.map((c) => (
        <li key={c.slug}>
          <Link href={`/product-category/${c.slug}`} className={cls(pathname === `/product-category/${c.slug}`)}>
            {c.name}
          </Link>
        </li>
      ))}
    </>
  );
}
