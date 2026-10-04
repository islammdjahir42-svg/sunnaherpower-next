"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import type { Image as Img } from "@/lib/types";

type Props = { images: Img[]; name: string; discount?: number };

export default function ProductGallery({ images, name, discount = 0 }: Props) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);
  const [zoom, setZoom] = useState({ show: false, x: 50, y: 50 });
  const imgRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const lbTouchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") setLbIndex((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setLbIndex((i) => (i + 1) % images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, images.length]);

  useEffect(() => {
    document.body.style.overflow = lightbox ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  if (!images.length) return <div className="aspect-square bg-[#f6f6f6]" />;
  const main = images[active];

  // Desktop zoom
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoom({ show: true, x, y });
  };

  // Mobile swipe on main image
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setActive((i) => (i + 1) % images.length);
      else setActive((i) => (i - 1 + images.length) % images.length);
    }
    touchStartX.current = null;
  };

  // Mobile swipe on lightbox
  const handleLbTouchStart = (e: React.TouchEvent) => {
    lbTouchStartX.current = e.touches[0].clientX;
  };
  const handleLbTouchEnd = (e: React.TouchEvent) => {
    if (lbTouchStartX.current === null) return;
    const diff = lbTouchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setLbIndex((i) => (i + 1) % images.length);
      else setLbIndex((i) => (i - 1 + images.length) % images.length);
    }
    lbTouchStartX.current = null;
  };

  const prev = () => setLbIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setLbIndex((i) => (i + 1) % images.length);

  return (
    <>
      <div>
        <div
          ref={imgRef}
          className="relative aspect-square overflow-hidden bg-white cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setZoom((z) => ({ ...z, show: false }))}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            src={main.src}
            alt={main.alt || name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className={`object-contain transition-opacity duration-150 pointer-events-none ${zoom.show ? "opacity-0" : "opacity-100"}`}
            draggable={false}
          />
          {zoom.show && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url(${main.src})`,
                backgroundSize: "300%",
                backgroundPosition: `${zoom.x}% ${zoom.y}%`,
                backgroundRepeat: "no-repeat",
              }}
            />
          )}
          {discount > 0 && (
            <span className="absolute top-3 right-3 rounded-full bg-sale px-2.5 py-1 text-xs font-bold text-white z-10">
              -{discount}%
            </span>
          )}
          <button
            onClick={() => { setLbIndex(active); setLightbox(true); }}
            aria-label="বড় করে দেখুন"
            className="absolute bottom-3 left-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-muted shadow hover:bg-white"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
            </svg>
          </button>

          {/* Mobile swipe dots */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
              {images.map((_, i) => (
                <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === active ? "bg-accent" : "bg-white/60"}`} />
              ))}
            </div>
          )}
        </div>

        {/* Desktop thumbnails */}
        {images.length > 1 && (
          <div className="mt-3 hidden md:flex justify-center gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActive(i)}
                aria-label={`ছবি ${i + 1}`}
                className={`relative h-16 w-16 shrink-0 overflow-hidden bg-white ring-2 ${i === active ? "ring-accent" : "ring-transparent"}`}
              >
                <Image src={img.thumbnail} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Mobile thumbnails */}
        {images.length > 1 && (
          <div className="mt-3 flex md:hidden justify-center gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActive(i)}
                className={`relative h-14 w-14 shrink-0 overflow-hidden bg-white ring-2 ${i === active ? "ring-accent" : "ring-transparent"}`}
              >
                <Image src={img.thumbnail} alt="" fill sizes="56px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          onClick={() => setLightbox(false)}
          onTouchStart={handleLbTouchStart}
          onTouchEnd={handleLbTouchEnd}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-5 right-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white text-2xl hover:bg-white/30"
          >
            ✕
          </button>

          {images.length > 1 && (
            <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/50 text-sm z-10">
              {lbIndex + 1} / {images.length}
            </span>
          )}

          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 z-10 hidden sm:flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-white text-4xl hover:bg-white/30"
            >
              ‹
            </button>
          )}

          <div className="relative w-[90vw] h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={images[lbIndex].src}
              alt={images[lbIndex].alt || name}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 z-10 hidden sm:flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-white text-4xl hover:bg-white/30"
            >
              ›
            </button>
          )}

          {/* Mobile dots in lightbox */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 sm:hidden">
              {images.map((_, i) => (
                <span key={i} className={`h-2 w-2 rounded-full ${i === lbIndex ? "bg-white" : "bg-white/30"}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
