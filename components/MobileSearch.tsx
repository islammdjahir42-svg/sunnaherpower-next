"use client";
import { useState } from "react";
import { SearchIcon } from "./Icons";
import SearchBox from "./SearchBox";

export default function MobileSearch() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen((o) => !o)} aria-label="খুঁজুন" className="text-ink">
        <SearchIcon className="h-[22px] w-[22px]" />
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-40 border-t border-line bg-white p-3 shadow">
          <SearchBox autoFocus onPick={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
