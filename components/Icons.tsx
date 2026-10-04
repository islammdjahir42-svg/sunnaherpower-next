type P = { className?: string };

export function SearchIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} className={className} aria-hidden>
      <circle cx="10.5" cy="10.5" r="7" />
      <path d="m20.5 20.5-5-5" strokeLinecap="round" />
    </svg>
  );
}

export function BagIcon({ className = "h-[26px] w-[26px]" }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} className={className} aria-hidden>
      <path d="M5 8h14l-1 12.5a1 1 0 0 1-1 .9H7a1 1 0 0 1-1-.9L5 8Z" strokeLinejoin="round" />
      <path d="M9 10V6.5a3 3 0 0 1 6 0V10" strokeLinecap="round" />
    </svg>
  );
}

export function CartIcon({ className = "h-4 w-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM1 2h3.3l.9 2H21a1 1 0 0 1 .9 1.4l-3.6 7a2 2 0 0 1-1.8 1.1H8.1l-1 1.8h12.4v2H5.4a1.5 1.5 0 0 1-1.3-2.2l1.4-2.6L2.7 4H1V2Z" />
    </svg>
  );
}
