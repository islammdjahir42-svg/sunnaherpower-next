"use client";
import { useEffect, useRef } from "react";

export default function DescriptionCleaner() {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const section = document.querySelector(".product-desc");
    if (!section) return;
    // Remove trailing empty p/div/li elements
    const removeTrailingEmpty = (parent: Element) => {
      let last = parent.lastElementChild;
      while (last) {
        const text = last.textContent?.replace(/\u00a0/g, "").trim() ?? "";
        const hasMedia = last.querySelector("img, iframe, video");
        if (!text && !hasMedia) {
          last.remove();
          last = parent.lastElementChild;
        } else {
          break;
        }
      }
    };
    section.querySelectorAll(".wp-content").forEach(removeTrailingEmpty);
    removeTrailingEmpty(section);
  }, []);
  return null;
}
