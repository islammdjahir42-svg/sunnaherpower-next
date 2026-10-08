"use client";
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
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export const LOGO = "/logo.jpeg";
const MENU = ["flash-light", "hurricane-light", "lamp-light", "mini-light", "solar-light"];

export default function Header({ categories }: { categories: Category[] }) {
  const menu = MENU.map((slug) => categories.find((c) => c.slug === slug)).filter((c): c is Category => !!c);
  const drawer = categories.map((c) => ({ slug: c.slug, name: decode(c.name) }));
  const router = useRouter();
  const [user, setUser] = useState<{name:string;email:string}|null>(null);
  const [topbar, setTopbar] = useState<{enabled:boolean;text1:string;amount:string;text2:string}>({ enabled: true, text1: "একাউন্ট খুলুন এবং প্রথম অর্ডারে", amount: "১০০ টাকা", text2: "ছাড় পান!" });

  useEffect(() => {
    fetch("https://wp.sunnaherpower.com/wp-json/sunnaher/v1/topbar")
      .then(r => r.json())
      .then(d => { if (d.text1) setTopbar(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const load = () => {
      try {
        const u = localStorage.getItem("ss_user");
        setUser(u ? JSON.parse(u) : null);
      } catch { setUser(null); }
    };
    load();
    window.addEventListener("ss_auth_change", load);
    return () => window.removeEventListener("ss_auth_change", load);
  }, []);

  const logout = () => {
    localStorage.removeItem("ss_token");
    localStorage.removeItem("ss_user");
    setUser(null);
    window.dispatchEvent(new Event("ss_auth_change"));
    router.push("/");
  };

  return (
    <>
      {topbar.enabled && <div className="overflow-hidden" style={{background:"#1c1f3a",height:"36px",display:"flex",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",width:"100%",overflow:"hidden",position:"relative"}}>
          <style>{`
            @keyframes marquee {
              0% { transform: translateX(100vw); }
              100% { transform: translateX(-100%); }
            }
            .marquee-text {
              display: inline-block;
              white-space: nowrap;
              animation: marquee 18s linear infinite;
              color: #fff;
              font-size: 13px;
              font-weight: 600;
              padding: 0 2rem;
            }
          `}</style>
          <span className="marquee-text">
            🎉 {topbar.text1} <span style={{color:"#ffd700",fontWeight:"800"}}>{topbar.amount}</span> {topbar.text2} &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; 🛒 রেজিস্ট্রেশন করুন — সারাজীবন সুবিধা নিন! &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; 🎉 {topbar.text1} <span style={{color:"#ffd700",fontWeight:"800"}}>{topbar.amount}</span> {topbar.text2}
          </span>
        </div>
      </div>}
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        {/* Mobile: menu | logo | search + cart */}
        <div className="grid h-[60px] grid-cols-3 items-center px-3 md:hidden">
          <MobileMenu menu={menu.map((c) => ({ slug: c.slug, name: decode(c.name) }))} categories={drawer} />
          <Link href="/" aria-label="সুন্নাহের পাওয়ার হোম" className="justify-self-center">
            <Image src={LOGO} alt="Sunnaher Power" width={200} height={100} priority className="h-[52px] w-auto" />
          </Link>
          <div className="flex items-center justify-end gap-3">
            <MobileSearch />
            {user ? (
              <Link href="/profile" className="text-xs font-bold text-[#8B4513]">👤 {user.name.split(" ")[0]}</Link>
            ) : (
              <Link href="/login" className="text-xs font-bold px-2 py-1 rounded-full border border-[#8B4513] text-[#8B4513]">
                লগইন
              </Link>
            )}
            <CartButton compact />
          </div>
        </div>

        {/* Desktop */}
        <div className="mx-auto hidden h-[105px] max-w-[1224px] items-center gap-4 px-4 md:flex">
          <Link href="/" aria-label="সুন্নাহের পাওয়ার হোম" className="shrink-0">
            <Image src={LOGO} alt="Sunnaher Power" width={200} height={100} priority className="h-[98px] w-auto" />
          </Link>
          <div className="ml-auto w-full max-w-[290px]">
            <SearchBox />
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/profile" className="text-sm font-bold text-ink hover:text-[#8B4513]">👤 {user.name.split(" ")[0]}</Link>
                <button onClick={logout} className="text-xs px-3 py-1.5 rounded-full border border-line text-muted hover:bg-[#f7f7f7]">লগআউট</button>
              </div>
            ) : (
              <Link href="/login" className="text-sm font-bold px-4 py-2 rounded-full border-2 border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513] hover:text-white transition-colors">
                লগইন / রেজিস্ট্রার
              </Link>
            )}
            <CartButton />
          </div>
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
