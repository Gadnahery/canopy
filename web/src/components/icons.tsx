// Minimal inline icon set (stroke-based, currentColor) — no icon library needed.
type P = { className?: string };
const base = "h-5 w-5";

export const HomeIcon = ({ className = base }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" />
  </svg>
);
export const HistoryIcon = ({ className = base }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 4v4h4" /><path d="M12 8v4l3 2" />
  </svg>
);
export const ChartIcon = ({ className = base }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20V4" /><path d="M4 20h16" /><path d="M8 16l4-5 3 3 4-6" />
  </svg>
);
export const InfoIcon = ({ className = base }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" />
  </svg>
);
export const TreeIcon = ({ className = base }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2c2.4 0 3.6 1.6 3.8 3 .1.6.6.6 1.2 1 1.2.8 2 2 2 3.4 0 1.3-.7 2.4-1.8 3 .1.4.1.8.1 1.1 0 1.7-1.5 3-3.4 3H12v3h-1v-3H8.1C6.2 19.6 4.7 18.3 4.7 16.6c0-.3 0-.7.1-1.1C3.7 14.9 3 13.8 3 12.5c0-1.4.8-2.6 2-3.4.6-.4 1.1-.4 1.2-1C6.4 6.7 7.6 5 10 5c.5-1.8 1.8-3 2-3Z" />
  </svg>
);
export const RefreshIcon = ({ className = base }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 3v6h-6" />
  </svg>
);
export const MenuIcon = ({ className = base }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M4 12h16M4 6h16M4 18h16" />
  </svg>
);
