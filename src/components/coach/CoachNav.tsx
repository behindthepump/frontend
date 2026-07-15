import { Users, UserPlus } from "lucide-react";

export type CoachPage = "clients" | "requests";

// The coach's two destinations, one per job: the roster (look someone up)
// and the signup queue (act on who's waiting). The pending count rides the
// Requests item as a badge so it's visible from anywhere in the app.
const ITEMS = [
  { id: "clients", label: "Clients", Icon: Users },
  { id: "requests", label: "Requests", Icon: UserPlus }
] as const;

interface CoachNavProps {
  page: CoachPage;
  pendingCount: number;
  onSelect: (page: CoachPage) => void;
}

// Sidebar items (desktop)
export function CoachNav({ page, pendingCount, onSelect }: CoachNavProps) {
  return (
    <>
      {ITEMS.map(({ id, label, Icon }) => {
        const isSelected = page === id;
        const badge = id === "requests" && pendingCount > 0;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`w-full flex items-center space-x-3 font-semibold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl transition cursor-pointer ${
              isSelected
                ? "bg-[#FEC63F] text-[#111111] font-extrabold shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-gray-900"
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span>{label}</span>
            {badge && (
              <span
                // Re-keyed by count so it pops again whenever it changes
                key={pendingCount}
                className={`ml-auto text-[10px] font-black font-mono rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center animate-pop ${
                  isSelected ? "bg-[#111111] text-[#FEC63F]" : "bg-[#FEC63F] text-[#111111]"
                }`}
              >
                {pendingCount}
              </span>
            )}
          </button>
        );
      })}
    </>
  );
}

// Fixed bottom tab bar (mobile)
export function CoachBottomNav({ page, pendingCount, onSelect }: CoachNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111111] text-white border-t border-gray-950 flex justify-around py-2 px-1 z-30">
      {ITEMS.map(({ id, label, Icon }) => {
        const isSelected = page === id;
        const badge = id === "requests" && pendingCount > 0;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`flex flex-col items-center justify-center py-1 flex-1 text-center font-bold tracking-wider cursor-pointer ${
              isSelected ? "text-[#FEC63F]" : "text-gray-500"
            }`}
          >
            <span className="relative">
              <Icon className="w-5 h-5" />
              {badge && (
                <span
                  key={pendingCount}
                  className="absolute -top-1.5 -right-2.5 bg-[#FEC63F] text-[#111111] text-[8px] font-black font-mono rounded-full min-w-3.5 h-3.5 px-1 flex items-center justify-center animate-pop"
                >
                  {pendingCount}
                </span>
              )}
            </span>
            <span className="text-[8px] font-black uppercase mt-1">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
