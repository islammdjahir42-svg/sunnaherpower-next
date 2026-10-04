"use client";
import { useEffect } from "react";

export default function ProgressBar() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element).closest("a");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const raw = link.getAttribute("href");
      if (!raw || raw.startsWith("#") || /^(mailto|tel|javascript|whatsapp):/i.test(raw)) return;
      let url: URL;
      try { url = new URL(raw, location.href); } catch { return; }
      if (url.origin !== location.origin) return;
      e.preventDefault();
      e.stopPropagation();
      window.location.href = url.href;
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
