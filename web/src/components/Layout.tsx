import { NavLink, Outlet, useLocation } from "react-router-dom";
import { CalendarIcon, DeviceIcon, HomeIcon, HistoryIcon, ChartIcon, InfoIcon, TreeIcon, UserIcon } from "./icons";
import { isOnline, useDevices } from "../hooks/useDevices";

export const NAV = [
  { to: "/", label: "Dashboard", Icon: HomeIcon },
  { to: "/history", label: "History", Icon: HistoryIcon },
  { to: "/results", label: "Reports", Icon: ChartIcon },
  { to: "/about", label: "About CANOPIX", Icon: InfoIcon },
];

function Sidebar() {
  return <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-surface md:flex">
    <div className="flex items-center gap-3 border-b border-line px-5 py-4">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-primary text-white shadow-sm"><TreeIcon className="h-6 w-6" /></div>
      <div><div className="text-[25px] font-bold leading-none tracking-tight text-primary">CANOPIX</div><div className="mt-1 text-[11px] leading-none text-text-secondary">Forest Canopy Analysis</div></div>
    </div>
    <nav className="mt-4 flex flex-1 flex-col gap-2 px-4">
      {NAV.map(({ to, label, Icon }) => <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${isActive ? "bg-bg-light text-primary" : "text-text-secondary hover:bg-bg-light hover:text-text"}`}>
        {({ isActive }) => <><Icon className="h-5 w-5" />{isActive && <span className="absolute inset-y-3 left-0 w-1 rounded-full bg-primary" />}<span>{label}</span></>}
      </NavLink>)}
    </nav>
    <div className="m-4 overflow-hidden rounded-lg border border-line bg-bg-light text-center">
      <div className="px-4 pb-4 pt-5"><TreeIcon className="mx-auto h-10 w-10 text-primary" /><div className="mt-2 font-bold text-primary">CANOPIX</div><p className="mt-1 text-[11px] text-text-secondary">Portable · Accurate · Reliable</p><p className="mt-3 text-[11px] leading-relaxed text-text-secondary">Measuring today for healthier forests tomorrow.</p></div>
      <div className="h-10 bg-gradient-to-t from-primary/35 to-transparent" />
    </div>
  </aside>;
}

function Topbar() {
  const devices = useDevices();
  const connected = devices.some(isOnline);
  const now = new Date();
  return <div className="border-b border-line bg-surface px-4 py-3 sm:px-6">
    <div className="mx-auto flex max-w-[1440px] items-center justify-end gap-5 sm:gap-8">
      <div className="hidden items-center gap-2 border-r border-line pr-6 sm:flex"><span className={`grid h-8 w-6 place-items-center rounded-md ${connected ? "bg-primary text-white" : "bg-bg-light text-text-secondary"}`}><DeviceIcon className="h-4 w-4" /></span><div className="text-xs"><div className="font-semibold text-text">Device Status</div><div className={connected ? "font-semibold text-success" : "text-text-secondary"}>{connected ? "Connected" : "Offline"}</div></div></div>
      <div className="hidden items-center gap-2 border-r border-line pr-6 sm:flex"><CalendarIcon className="h-6 w-6 text-text" /><div className="text-right text-xs"><div className="font-semibold text-text">{now.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })}</div><div className="font-semibold text-text">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div></div></div>
      <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-white" aria-label="User profile"><UserIcon className="h-6 w-6" /></div>
    </div>
  </div>;
}

function BottomNav() {
  return <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"><div className="flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-1.5 shadow-glow">{NAV.map(({ to, label, Icon }) => <NavLink key={to} to={to} end={to === "/"} aria-label={label} className={({ isActive }) => `flex h-12 w-14 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-medium ${isActive ? "bg-bg-light text-primary" : "text-text-secondary"}`}><Icon className="h-5 w-5" /><span>{label.replace("About CANOPIX", "About")}</span></NavLink>)}</div></nav>;
}

export default function Layout() {
  const location = useLocation();
  return <div className="flex min-h-dvh"><Sidebar /><main className="min-w-0 flex-1 pb-28 md:pb-0"><Topbar /><div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:py-7"><div key={location.pathname}><Outlet /></div></div></main><BottomNav /></div>;
}
