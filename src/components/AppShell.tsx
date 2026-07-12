import React from "react";
import { Session } from "../auth";
import { Dumbbell, LogOut } from "lucide-react";

interface AppShellProps {
  session: Session;
  onLogout: () => void;
  sidebarNav: React.ReactNode;
  mobileSubheader?: React.ReactNode;
  bottomNav?: React.ReactNode;
  children: React.ReactNode;
}

// Shared chrome for every signed-in view: desktop sidebar, mobile header,
// main scroll area and an optional mobile bottom bar. Views supply only
// their own navigation and content.
export default function AppShell({
  session,
  onLogout,
  sidebarNav,
  mobileSubheader,
  bottomNav,
  children,
}: AppShellProps) {
  return (
    // min-h on mobile (100vh is unreliable under browser chrome there);
    // locked to the viewport on desktop so the sidebar never outgrows the
    // screen and only the content pane scrolls.
    <div className="min-h-screen md:h-screen bg-[#F7F7F7] text-[#111111] font-sans flex flex-col md:flex-row" id="app-root-container">
      {/* LEFT SIDEBAR NAVIGATION (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#111111] text-white border-r border-[#111111] relative z-20 shrink-0" id="aside-sidebar-desktop">
        {/* Sidebar Header Brand */}
        <div className="p-6 border-b border-gray-900 flex items-center space-x-3">
          <Dumbbell className="w-6 h-6 text-[#2ECC71]" />
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider">Transformation</h2>
            <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">12-Week Tracker</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">{sidebarNav}</nav>

        {/* Signed-in user - anchored at the bottom, away from the nav */}
        <div className="p-4 border-t border-gray-900 bg-[#1a1a1a] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-black text-white truncate">{session.name}</p>
            <p className="text-[10px] text-[#2ECC71] font-bold uppercase tracking-widest">
              {session.role === "coach" ? "Coach" : "Client"}
            </p>
          </div>
          <button
            onClick={onLogout}
            title="Sign out"
            aria-label="Sign out"
            className="text-gray-500 hover:text-white p-2 rounded-lg hover:bg-gray-900 transition cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </aside>

      {/* MOBILE HEADER / PORTABLE BAR */}
      <header className="md:hidden bg-[#111111] text-white flex flex-col px-4 py-3 border-b border-gray-900 z-10 shrink-0" id="mobile-navigation-bar">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center space-x-2 min-w-0">
            <Dumbbell className="w-5 h-5 text-[#2ECC71] shrink-0" />
            <span className="font-black text-xs uppercase tracking-widest text-[#2ECC71] truncate">12-Week Tracker</span>
          </div>

          <div className="flex items-center space-x-2 min-w-0">
            <span className="text-xs font-bold text-white truncate">{session.name}</span>
            <button
              onClick={onLogout}
              title="Sign out"
              aria-label="Sign out"
              className="text-gray-500 hover:text-white cursor-pointer p-2 -m-2 shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {mobileSubheader && (
          <div className="mt-2.5 pt-2 border-t border-gray-900">{mobileSubheader}</div>
        )}
      </header>

      {/* DYNAMIC SCENE CONTAINER */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8" id="primary-viewport-holder">
        {children}
      </main>

      {bottomNav}
    </div>
  );
}
