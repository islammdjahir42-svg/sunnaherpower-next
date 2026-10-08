"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOGO } from "./Header";

export default function Footer() {
  const pathname = usePathname();
  const isProduct = pathname.startsWith("/product");
  if (pathname === "/checkout") return null;
  return (
    <>
      <footer className={`mt-12 text-white ${isProduct ? "pb-[120px] md:pb-0" : ""}`} style={{ background: "linear-gradient(135deg, #6B3410 0%, #8B4513 100%)" }}>
        <div className="mx-auto max-w-[1224px] px-4 py-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-3">
              <Image src={LOGO} alt="Sunnaher Power" width={160} height={80} className="h-10 w-auto" />
              <p className="text-sm leading-6 text-white/80">
                বাংলাদেশের সেরা মানের রিচার্জেবল টর্চ লাইট, সোলার লাইট ও হারিকেন। সারা দেশে ক্যাশ অন ডেলিভারি।
              </p>
              <div className="space-y-2 text-sm">
                <a href="tel:01707638902" className="flex items-center gap-2 text-white/90 hover:text-white">
                  📞 <span>01707638902</span>
                </a>
                <a href="mailto:Support@sunnaherpower.com" className="flex items-center gap-2 text-white/90 hover:text-white">
                  ✉️ <span>Support@sunnaherpower.com</span>
                </a>
              </div>
            </div>

            <div>
              <p className="mb-3 font-bold text-white">প্রয়োজনীয় লিংক</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/contact-us" className="text-white/80 hover:text-white">📞 Contact Us</Link></li>
                <li><Link href="/privacy-policy" className="text-white/80 hover:text-white">🔒 Privacy Policy</Link></li>
                <li><Link href="/return-replacement-policy" className="text-white/80 hover:text-white">🔄 Return & Replacement Policy</Link></li>
              </ul>
            </div>

            <div>
              <p className="mb-3 font-bold text-white">আমাদের সাথে যুক্ত থাকুন</p>
              <div className="flex gap-3">
                <a href="https://www.facebook.com/SunnaherPower/" target="_blank" rel="noopener" aria-label="Facebook"
                  className="grid h-10 w-10 place-items-center rounded-full bg-[#1877f2] shadow hover:opacity-90">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                    <path fill="white" d="M13.4 19.5v-6h2l.3-2.4h-2.3V9.6c0-.7.2-1.2 1.2-1.2h1.2V6.3a16 16 0 0 0-1.8-.1c-1.8 0-3 1.1-3 3.1v1.8h-2v2.4h2v6h2.4Z" />
                  </svg>
                </a>
                <a href="https://www.youtube.com/@sunnahersopan" target="_blank" rel="noopener" aria-label="YouTube"
                  className="grid h-10 w-10 place-items-center rounded-full bg-[#ff0000] shadow hover:opacity-90">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                    <path fill="white" d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.4 3 12 3 12 3s-4.4 0-6.8.2c-.6 0-1.9 0-3 1.2C1.3 5.2 1 7 1 7S.7 9.1.7 11.3v2c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.3 21.6 12 21.7 12 21.7s4.4 0 6.8-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.7 1.2-2.7s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7Zm-13.5 8.5v-8l8 4-8 4Z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 py-3 text-center text-xs text-white/60">
          © {new Date().getFullYear()} সুন্নাহের পাওয়ার — সর্বস্বত্ব সংরক্ষিত
        </div>
      </footer>

      {/* Floating call */}
      <a href="tel:+8801908795252" aria-label="কল করুন"
        className="fixed bottom-4 left-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#119a26] text-white shadow-xl ring-2 ring-white ">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden>
          <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1l-2.2 2.23Z" />
        </svg>
      </a>

      {/* Floating WhatsApp */}
      <a href="https://wa.me/8801908795252" target="_blank" rel="noopener" aria-label="WhatsApp"
        className="fixed right-4 bottom-4 z-50 grid h-[52px] w-[52px] place-items-center rounded-[14px] bg-gradient-to-b from-[#5ff777] to-[#12b72c] text-white shadow-xl ring-2 ring-white ">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" aria-hidden>
          <path d="M20.5 3.5A11.8 11.8 0 0 0 1.9 17.7L.3 23.5l6-1.6A11.8 11.8 0 0 0 23.8 12a11.7 11.7 0 0 0-3.3-8.5ZM12.1 21.6a9.7 9.7 0 0 1-5-1.4l-.3-.2-3.6.9 1-3.5-.2-.4a9.8 9.8 0 1 1 8.1 4.6Zm5.4-7.3c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1a8 8 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1 2.5 5.9 5.9 0 0 0 1.2 3.1 13.4 13.4 0 0 0 5.2 4.6c1.9.8 2.7.9 3.6.8a3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.1-.3-.2-.6-.3Z" />
        </svg>
      </a>
    </>
  );
}
