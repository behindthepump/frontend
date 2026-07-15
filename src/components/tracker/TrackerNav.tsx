import { Flame, Dumbbell, LineChart, User as UserIcon, LayoutDashboard } from "lucide-react";

// The client's five tracker tabs (the coach has its own nav - see
// coach/CoachNav.tsx).
export const TRACKER_TABS = [
  { id: "dashboard", label: "Dashboard", shortLabel: "Home", Icon: LayoutDashboard },
  { id: "daily", label: "Daily Tracking", shortLabel: "Food", Icon: Flame },
  { id: "workout", label: "Workout Tracking", shortLabel: "Workouts", Icon: Dumbbell },
  { id: "progress", label: "Progress", shortLabel: "Progress", Icon: LineChart },
  { id: "profile", label: "Profile", shortLabel: "Profile", Icon: UserIcon }
];

interface TrackerNavProps {
  activeTab: string;
  onSelect: (tab: string) => void;
}

// Sidebar tab buttons (desktop)
export function TrackerNav({ activeTab, onSelect }: TrackerNavProps) {
  return (
    <>
      {TRACKER_TABS.map((tab) => {
        const IconComp = tab.Icon;
        const isSelected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`w-full flex items-center space-x-3 font-semibold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl transition cursor-pointer ${
              isSelected
                ? "bg-[#FEC63F] text-[#111111] font-extrabold shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-gray-900"
            }`}
          >
            <IconComp className="w-5 h-5 shrink-0" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </>
  );
}

// Fixed bottom tab bar (mobile)
export function TrackerBottomNav({ activeTab, onSelect }: TrackerNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111111] text-white border-t border-gray-950 flex justify-around py-2 px-1 z-30" id="portable-tab-row">
      {TRACKER_TABS.map((tab) => {
        const IconComp = tab.Icon;
        const isSelected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`flex flex-col items-center justify-center py-1 flex-1 text-center font-bold tracking-wider cursor-pointer ${
              isSelected ? "text-[#FEC63F]" : "text-gray-500"
            }`}
          >
            <IconComp className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase mt-1">{tab.shortLabel}</span>
          </button>
        );
      })}
    </nav>
  );
}
