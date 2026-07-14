import { useEffect, useRef, useState } from "react";
import { ClientSummary } from "../../store";
import { WEEKLY_GOAL } from "../../data";
import PaceTrack, { paceDelta } from "./PaceTrack";
import RingAvatar from "./RingAvatar";
import DotMeter from "./DotMeter";
import { recency, RECENCY_CHIP_LIGHT, RECENCY_EDGE } from "./recency";
import { Users, ArrowRight, Search, Loader2, Dumbbell, Flame } from "lucide-react";

interface ClientsRosterProps {
  clients: ClientSummary[]; // current roster page(s), stats computed server-side
  nextCursor: string | null;
  rosterLoading: boolean;
  onSearch: (term: string) => void;
  onLoadMore: () => void;
  onSelectClient: (clientId: string) => void;
}

export default function ClientsRoster({
  clients,
  nextCursor,
  rosterLoading,
  onSearch,
  onLoadMore,
  onSelectClient
}: ClientsRosterProps) {
  // Debounced server-side search; "/" focuses it from anywhere on the page
  const [searchInput, setSearchInput] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const searchInitialised = useRef(false);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  useEffect(() => {
    if (!searchInitialised.current) {
      searchInitialised.current = true;
      return;
    }
    const timer = setTimeout(() => onSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const searching = searchInput.trim().length > 0;
  // Program weeks are Monday-anchored, so days elapsed in the current week
  // is just today's Mon-based weekday index.
  const dow = new Date().getDay();
  const weekDaysElapsed = dow === 0 ? 7 : dow;

  return (
    <div className="space-y-5 animate-fadeIn" id="coach-clients-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Clients</h1>

        <div className="relative sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref={searchRef}
            type="search"
            placeholder="Search by first or last name…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-white border border-gray-200 focus:border-[#2ECC71] text-gray-900 font-bold text-sm pl-10 pr-9 py-2.5 rounded-xl transition outline-none"
          />
          <kbd className="hidden sm:block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-gray-300 border border-gray-200 rounded px-1.5 py-0.5 pointer-events-none">
            /
          </kbd>
        </div>
      </div>

      {/* First page / new search loads as ghost cards, not a spinner */}
      {rosterLoading && clients.length === 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-gray-100 border-l-4 border-l-gray-100 space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-2/5 bg-gray-100 rounded-md" />
                  <div className="h-3 w-1/4 bg-gray-100 rounded-md" />
                </div>
              </div>
              <div className="h-7 w-1/3 bg-gray-100 rounded-md" />
              <div className="h-2 w-full bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {!rosterLoading && clients.length === 0 && (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-200 text-center space-y-2 w-full max-w-md">
            <Users className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-600">
              {searching ? "No clients match your search" : "No clients yet"}
            </p>
            {!searching && (
              <p className="text-xs text-gray-400">
                Clients sign up from the app — approve their requests to kick off their 12-week program.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4" id="coach-clients-list">
        {clients.map(({ user: client, stats }, index) => {
          const goalKg = parseFloat((client.starting_weight - client.target_weight).toFixed(1));
          const goalPct = goalKg > 0 ? Math.min(1, stats.total_weight_lost / goalKg) : 0;
          const week =
            stats.program_status === "completed"
              ? 12
              : stats.program_status === "active"
              ? stats.current_week
              : 0;
          const pace = paceDelta(goalKg, stats.total_weight_lost, week);
          const rec = recency(stats.program_status, stats.last_logged);

          // The whole card is the drill-in target; the only other action
          // (delete) lives in the drill-in's danger zone.
          return (
            <button
              type="button"
              key={client.id}
              onClick={() => onSelectClient(client.id)}
              className={`group relative text-left w-full bg-white p-5 rounded-2xl border border-gray-100 border-l-4 ${RECENCY_EDGE[rec.key]} transition duration-200 shadow-3xs hover:shadow-sm hover:-translate-y-0.5 space-y-4 animate-fadeIn cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2ECC71]`}
              style={{ animationDelay: `${Math.min(index, 7) * 45}ms`, animationFillMode: "backwards" }}
            >
              {/* Identity row: ring = goal progress, chip = recency */}
              <div className="flex items-center gap-3">
                <RingAvatar name={client.name} pct={goalPct} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-base font-extrabold text-gray-900 truncate">
                      {client.name}
                    </h3>
                    {rec.key !== "not_started" && (
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0 ${RECENCY_CHIP_LIGHT[rec.key]}`}
                      >
                        {rec.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    {stats.program_status === "not_started"
                      ? `Starts ${client.program_start_date}`
                      : stats.program_status === "completed"
                      ? "Completed • 12 weeks"
                      : `Week ${stats.current_week} of 12`}
                  </p>
                </div>
              </div>

              {/* The stat moment: kg lost, big; pace verdict beside it */}
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                    Lost so far
                  </p>
                  <p className="text-2xl leading-none font-black font-mono text-gray-900 mt-1">
                    {stats.total_weight_lost > 0 ? `−${stats.total_weight_lost}` : "0"}
                    <span className="text-xs text-gray-400 font-bold"> / {goalKg} kg</span>
                  </p>
                </div>
                {pace && (
                  <span className={`text-[10px] font-bold font-mono px-2 py-1 rounded-md shrink-0 ${pace.cls}`}>
                    {pace.label}
                  </span>
                )}
              </div>

              {/* Pace vs plan: fill = progress to goal, tick = where this
                  week says they should be */}
              <PaceTrack goalKg={goalKg} lost={stats.total_weight_lost} week={week} />

              {/* This week's instrument lights + the open affordance */}
              <div className="flex items-center gap-5 border-t border-gray-50 pt-3">
                {stats.program_status === "active" && (
                  <>
                    <DotMeter
                      Icon={Dumbbell}
                      filled={Math.min(stats.week_workouts_completed, WEEKLY_GOAL)}
                      total={WEEKLY_GOAL}
                      title={`${stats.week_workouts_completed} of ${WEEKLY_GOAL} workouts this week`}
                    />
                    <DotMeter
                      Icon={Flame}
                      filled={Math.min(stats.week_days_logged, weekDaysElapsed)}
                      total={weekDaysElapsed}
                      title={`${stats.week_days_logged} of ${weekDaysElapsed} days logged this week`}
                    />
                  </>
                )}
                <ArrowRight className="w-4 h-4 text-gray-300 ml-auto transition duration-200 group-hover:translate-x-1 group-hover:text-[#2ECC71]" />
              </div>
            </button>
          );
        })}
      </div>

      {rosterLoading && clients.length > 0 && (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 text-[#2ECC71] animate-spin" />
        </div>
      )}

      {!rosterLoading && nextCursor && (
        <button
          type="button"
          onClick={onLoadMore}
          className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          Load More Clients
        </button>
      )}
    </div>
  );
}
