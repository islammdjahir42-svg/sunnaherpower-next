import Link from "next/link";

type Props = { base: string; page: number; hasNext: boolean; extra?: Record<string, string> };

export default function Pager({ base, page, hasNext, extra }: Props) {
  if (page === 1 && !hasNext) return null;
  const href = (p: number) => `${base}?${new URLSearchParams({ ...extra, page: String(p) })}`;
  return (
    <nav className="mt-8 flex justify-center gap-3">
      {page > 1 && <Link href={href(page - 1)} className="rounded-lg bg-white px-4 py-2 ring-1 ring-black/10">আগের পেজ</Link>}
      {hasNext && <Link href={href(page + 1)} className="rounded-lg bg-white px-4 py-2 ring-1 ring-black/10">পরের পেজ</Link>}
    </nav>
  );
}
