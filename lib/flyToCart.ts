"use client";

// প্রোডাক্টের ছবি বাটন থেকে উড়ে হেডারের কার্ট আইকনে গিয়ে পড়ে। মোবাইল + ডেস্কটপ দুটোতেই।
// যে কার্ট আইকনটা এখন স্ক্রিনে দেখা যাচ্ছে (মোবাইল না ডেস্কটপ) সেটাকেই খুঁজে নেয়।
export function flyToCart(from: HTMLElement | null, imgSrc?: string, duration = 750): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !from || !imgSrc) return resolve();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return resolve();

    const target = [...document.querySelectorAll<HTMLElement>("[data-cart-target]")].find((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    if (!target) return resolve();

    const a = from.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const size = 70;
    const x0 = a.left + a.width / 2 - size / 2;
    const y0 = a.top + a.height / 2 - size / 2;
    const dx = b.left + b.width / 2 - size / 2 - x0;
    const dy = b.top + b.height / 2 - size / 2 - y0;

    const img = document.createElement("img");
    img.src = imgSrc;
    img.alt = "";
    Object.assign(img.style, {
      position: "fixed",
      left: `${x0}px`,
      top: `${y0}px`,
      width: `${size}px`,
      height: `${size}px`,
      objectFit: "contain",
      background: "#fff",
      borderRadius: "10px",
      boxShadow: "0 6px 18px rgba(0,0,0,.25)",
      zIndex: "9999",
      pointerEvents: "none",
    });
    document.body.appendChild(img);

    // বাঁকা পথে ওড়ে: মাঝপথে একটু উপরে উঠে তারপর কার্টে নামে
    const anim = img.animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 80}px) scale(0.75)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0.6 },
      ],
      { duration, easing: "cubic-bezier(.45,.05,.55,.95)" }
    );

    const done = () => {
      img.remove();
      target.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }],
        { duration: 350, easing: "ease-out" }
      );
      resolve();
    };
    anim.onfinish = done;
    anim.oncancel = done;
  });
}
