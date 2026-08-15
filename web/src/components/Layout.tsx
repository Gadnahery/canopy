import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { HomeIcon, HistoryIcon, ChartIcon, InfoIcon, TreeIcon, MenuIcon } from "./icons";

export const NAV = [
  { to: "/",        label: "Home",    Icon: HomeIcon },
  { to: "/history", label: "History", Icon: HistoryIcon },
  { to: "/results", label: "Results", Icon: ChartIcon },
  { to: "/about",   label: "About",   Icon: InfoIcon },
];

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-surface/60 backdrop-blur transition-all duration-300 md:flex ${
        collapsed ? "w-[76px]" : "w-60"
      }`}
    >
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
          <TreeIcon className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-text">CANOPIX</div>
            <div className="truncate text-[11px] text-text-secondary">Forest Canopy Analysis</div>
          </div>
        )}
      </div>

      <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
        {NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                isActive ? "bg-primary/10 text-primary" : "text-text-secondary hover:bg-base/50 hover:text-text"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span layoutId="side-active" className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-primary" />
                )}
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <button onClick={onToggle} className="m-3 flex items-center justify-center gap-2 rounded-2xl border border-line py-2 text-xs text-text-secondary hover:bg-base/50">
        <MenuIcon className="h-4 w-4" />
        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="flex items-center gap-1 rounded-full border border-line bg-surface/80 px-2 py-1.5 shadow-glow backdrop-blur-xl">
        {NAV.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} end={to === "/"} aria-label={label}
            className={({ isActive }) =>
              `relative flex h-12 w-14 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-medium transition ${
                isActive ? "text-primary" : "text-text-secondary"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span layoutId="tab-active" className="absolute inset-0 rounded-full bg-primary/10 ring-1 ring-primary/10" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                )}
                <Icon className="relative h-5 w-5" />
                <span className="relative">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  return (
    <div className="flex min-h-dvh">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main className="min-w-0 flex-1 pb-28 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
