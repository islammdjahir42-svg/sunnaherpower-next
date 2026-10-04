"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "./Icons";

type Hit = { slug: string; name: string; image: string; price: number; regular: number; discount: number };

const tk = (n: number) => `৳${n.toLocaleString("en-US")}`;
const MIN = 3; // কয়টা অক্ষর লিখলে সাজেশন আসবে

export default function SearchBox({ autoFocus = false, onPick }: { autoFocus?: boolean; onPick?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLDivElement>(null);

  // লেখা থামার ২৫০ms পর খোঁজে, প্রতিটা অক্ষরে API কল হয় না
  useEffect(() => {
    const term = q.trim();
    if (term.length < MIN) { setHits([]); setLoading(false); return; }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        setHits(await res.json());
        setActive(-1);
      } catch {}
      setLoading(false);
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  // বাইরে ক্লিক করলে বন্ধ
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const go = (href: string) => { setOpen(false); onPick?.(); window.location.href = href; };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(hits.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(-1, a - 1)); }
    else if (e.key === "Escape") setOpen(false);
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); go(`/product/${hits[active].slug}`); }
  };

  const show = open && q.trim().length >= MIN;

  return (
    <div ref={box} className="relative w-full">
      <form action="/shop" onSubmit={() => { setOpen(false); onPick?.(); }}>
        <input
          name="q"
          type="search"
          value={q}
          autoFocus={autoFocus}
          autoComplete="off"
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder="Search for products"
          className="w-full appearance-none border border-line py-3 pr-12 pl-4 text-sm focus:border-accent focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        <button className="absolute inset-y-0 right-0 grid w-12 place-items-center text-[#333] hover:text-accent" aria-label="খুঁজুন">
          <SearchIcon className="h-[22px] w-[22px]" />
        </button>
      </form>

      {show && (
        <div className="absolute inset-x-0 top-full z-50 mt-1 max-h-[70vh] overflow-y-auto border border-line bg-white shadow-lg">
          {loading && !hits.length && <p className="px-4 py-3 text-sm text-muted">খুঁজছি…</p>}
          {!loading && !hits.length && <p className="px-4 py-3 text-sm text-muted">কোনো প্রোডাক্ট পাওয়া যায়নি</p>}
          {hits.map((h, i) => (
            <Link
              key={h.slug}
              href={`/product/${h.slug}`}
              onClick={(e) => { e.preventDefault(); go(`/product/${h.slug}`); }}
              className={`flex items-center gap-3 border-b border-line px-3 py-2 last:border-b-0 ${i === active ? "bg-[#f7f7f7]" : "hover:bg-[#f7f7f7]"}`}
            >
              {h.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={h.image} alt="" className="h-12 w-12 shrink-0 object-contain" />
              ) : (
                <span className="h-12 w-12 shrink-0 bg-[#f2f2f2]" />
              )}
              <span className="line-clamp-2 min-w-0 flex-1 text-sm leading-5 text-ink">{h.name}</span>
              <span className="shrink-0 text-right text-sm leading-5">
                {h.discount > 0 && <del className="block text-[#e4531c]">{tk(h.regular)}</del>}
                <span className="block font-bold text-[#1f9d24]">{tk(h.price)}</span>
              </span>
            </Link>
          ))}
          {hits.length > 0 && (
            <button
              onClick={() => go(`/shop?q=${encodeURIComponent(q.trim())}`)}
              className="block w-full px-4 py-2.5 text-center text-sm font-semibold text-accent hover:bg-[#f7f7f7]"
            >
              সব ফলাফল দেখুন
            </button>
          )}
        </div>
      )}
    </div>
  );
}
