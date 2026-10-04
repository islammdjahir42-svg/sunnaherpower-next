import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/types";
import CartButton from "./CartButton";
import MobileMenu from "./MobileMenu";
import MobileSearch from "./MobileSearch";
import MobileTabs from "./MobileTabs";
import NavLinks from "./NavLinks";
import { decode } from "@/lib/format";
import SearchBox from "./SearchBox";

const WP = (process.env.WP_URL || "https://sunnahersopan.com").replace(/\/$/, "");
// Logo hosted on the source site - works regardless of which WP backend is active
export const LOGO = "/logo.jpeg";

// Same menu as the original site, in the same order
const MENU = ["flash-light", "hurricane-light", "lamp-light", "mini-light", "solar-light"];

export default function Header({ categories }: { categories: Category[] }) {
  const menu = MENU.map((slug) => categories.find((c) => c.slug === slug)).filter((c): c is Category => !!c);
  const drawer = categories.map((c) => ({ slug: c.slug, name: decode(c.name) }));

  return (
    <>
      <div className="h-7 md:h-[42px]" style={{background:"#8B4513"}} aria-hidden />
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        {/* Mobile: menu | logo | search + cart */}
        <div className="grid h-[60px] grid-cols-3 items-center px-3 md:hidden">
          <MobileMenu menu={menu.map((c) => ({ slug: c.slug, name: decode(c.name) }))} categories={drawer} />
          <Link href="/" aria-label="সুন্নাহের সোপান হোম" className="justify-self-center">
            <Image src={LOGO} alt="Sunnaher Sopan" width={200} height={100} priority className="h-[52px] w-auto" />
          </Link>
          <div className="flex items-center justify-end gap-4">
            <MobileSearch />
            <CartButton compact />
          </div>
        </div>

        {/* Desktop */}
        <div className="mx-auto hidden h-[105px] max-w-[1224px] items-center gap-4 px-4 md:flex">
          <Link href="/" aria-label="সুন্নাহের সোপান হোম" className="shrink-0">
            <Image src={LOGO} alt="Sunnaher Sopan" width={200} height={100} priority className="h-[98px] w-auto" />
          </Link>
          <div className="ml-auto w-full max-w-[290px]">
            <SearchBox />
          </div>
          <CartButton />
        </div>
        <nav className="hidden md:block" style={{background:"#8B4513",padding:"0 1rem"}}>
          <ul className="mx-auto flex max-w-[1224px] gap-1 overflow-x-auto py-2 text-[14px] font-bold tracking-tight whitespace-nowrap">
            <NavLinks items={menu.map((c) => ({ slug: c.slug, name: decode(c.name) }))} />
          </ul>
        </nav>
      </header>
      {/* Mobile pill tab bar */}
      <nav className="sticky top-[60px] z-20 overflow-x-auto md:hidden" style={{background:"#8B4513",padding:"8px 12px"}}>
        <MobileTabs items={menu.map((c) => ({ slug: c.slug, name: decode(c.name) }))} />
      </nav>
    </>
  );
}
