import React, { useEffect, useRef, useState } from "react";
import { User } from "../types";
import { ClientStats, ClientSummary } from "../store";
import { mondayOf, todayStr, formatShortDate, PROGRAM_WEEKS } from "../data";
import Expand from "./Expand";
import {
  Users,
  UserPlus,
  ArrowRight,
  Trash2,
  Check,
  X,
  CalendarCheck,
  Search,
  Loader2,
  ChevronDown,
  Dumbbell,
  Flame
} from "lucide-react";

// The roster's recency signal, coloured by urgency: logged today (green),
// active this week (neutral), gone quiet (amber), never started (orange).
function recencyChip(stats: ClientStats): { label: string; cls: string } | null {
  if (stats.program_status === "not_started") return null;
  if (!stats.last_logged) return { label: "Never logged", cls: "bg-orange-100 text-orange-700" };
  const today = todayStr();
  if (stats.last_logged === today) {
    return { label: "Logged today", cls: "bg-[#2ECC71]/15 text-emerald-700" };
  }
  if (stats.last_logged >= mondayOf(today)) {
    return { label: `Logged ${formatShortDate(stats.last_logged)}`, cls: "bg-gray-100 text-gray-600" };
  }
  return { label: `Quiet since ${formatShortDate(stats.last_logged)}`, cls: "bg-amber-100 text-amber-800" };
}

// "Today" / "3d ago" reads faster than a date; fall back to the date once
// it's a week old.
function requestedAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return formatShortDate(iso.slice(0, 10));
}

interface CoachDashboardProps {
  clients: ClientSummary[]; // current roster page(s), stats computed server-side
  requests: User[]; // pending + declined signups
  nextCursor: string | null;
  rosterLoading: boolean;
  onSearch: (term: string) => void;
  onLoadMore: () => void;
  onSelectClient: (clientId: string) => void;
  onApproveClient: (
    clientId: string,
    programStartDate: string,
    workoutFrequency: 2 | 3
  ) => Promise<string | null>;
  onDeclineClient: (clientId: string) => Promise<string | null>;
  onDeleteClient: (clientId: string) => Promise<string | null>;
}

export default function CoachDashboard({
  clients,
  requests,
  nextCursor,
  rosterLoading,
  onSearch,
  onLoadMore,
  onSelectClient,
  onApproveClient,
  onDeclineClient,
  onDeleteClient,
}: CoachDashboardProps) {
  const [rosterError, setRosterError] = useState("");
  const [requestsError, setRequestsError] = useState("");
  // The request whose inline approve form (start date + frequency) is open
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approveDate, setApproveDate] = useState(mondayOf(todayStr()));
  const [approveFreq, setApproveFreq] = useState<2 | 3>(3);
  const [busyId, setBusyId] = useState<string | null>(null);
  // The request whose secondary details (age/height/BMR/email) are open
  const [detailsId, setDetailsId] = useState<string | null>(null);

  // Debounced server-side search
  const [searchInput, setSearchInput] = useState("");
  const searchInitialised = useRef(false);
  useEffect(() => {
    if (!searchInitialised.current) {
      searchInitialised.current = true;
      return;
    }
    const timer = setTimeout(() => onSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const openApprove = (uid: string) => {
    setApprovingId(uid);
    setApproveDate(mondayOf(todayStr()));
    setApproveFreq(3);
    setRequestsError("");
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingId) return;
    setBusyId(approvingId);
    const error = await onApproveClient(approvingId, approveDate, approveFreq);
    setBusyId(null);
    if (error) {
      setRequestsError(error);
      return;
    }
    setApprovingId(null);
    setRequestsError("");
  };

  const handleDecline = async (uid: string) => {
    setBusyId(uid);
    const error = await onDeclineClient(uid);
    setBusyId(null);
    setRequestsError(error ?? "");
    if (approvingId === uid) setApprovingId(null);
  };

  const searching = searchInput.trim().length > 0;

  return (
    <div className="space-y-6 animate-fadeIn" id="coach-dashboard-screen">
      {/* Header Banner */}
      <div className="bg-[#111111] p-6 rounded-2xl text-white border border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Coach Dashboard</h1>
          <p className="text-xs text-gray-400 mt-1">
            Approve signup requests, check progress, and open any client's tracker.
          </p>
        </div>

        {requests.filter((r) => r.status === "pending").length > 0 && (
          <div className="border p-3 rounded-xl font-mono text-center flex flex-col justify-center shrink-0 bg-[#2ECC71]/10 border-[#2ECC71]/40">
            <span className="text-[10px] text-gray-400 font-sans font-bold uppercase">
              Pending Requests
            </span>
            <span className="text-2xl font-black mt-0.5 text-[#2ECC71]">
              {requests.filter((r) => r.status === "pending").length}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="coach-main-grid">
        {/* Client List Grid */}
        <div className="lg:col-span-2 space-y-4" id="coach-clients-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-2 shrink-0">
              <Users className="w-4 h-4 text-[#2ECC71]" />
              <span>Your Clients</span>
            </h2>

            <div className="relative sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                placeholder="Search clients by name…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-white border border-gray-200 focus:border-[#2ECC71] text-gray-900 font-bold text-sm pl-10 pr-4 py-2.5 rounded-xl transition outline-none"
              />
            </div>
          </div>

          {rosterError && (
            <p className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
              {rosterError}
            </p>
          )}

          {!rosterLoading && clients.length === 0 && (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-200 text-center space-y-2">
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
          )}

          <div className="space-y-3" id="coach-clients-list">
            {clients.map(({ user: client, stats }) => {
              const goalKg = parseFloat((client.starting_weight - client.target_weight).toFixed(1));
              const goalPct =
                goalKg > 0 ? Math.min(100, Math.round((stats.total_weight_lost / goalKg) * 100)) : 0;
              const chip = recencyChip(stats);
              // Program weeks are Monday-anchored, so days elapsed in the
              // current week is just today's Mon-based weekday index.
              const dow = new Date().getDay();
              const weekDaysElapsed = dow === 0 ? 7 : dow;

              return (
              <div
                key={client.id}
                className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-[#2ECC71]/30 transition duration-200 shadow-3xs hover:shadow-2xs space-y-4 relative"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="text-lg font-extrabold text-gray-900 truncate">{client.name}</h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                      {stats.program_status === "not_started"
                        ? `Starts ${client.program_start_date}`
                        : stats.program_status === "completed"
                        ? "Completed • 12 weeks"
                        : `Week ${stats.current_week} of 12`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSelectClient(client.id)}
                      className="bg-gray-100 hover:bg-[#111111] hover:text-[#2ECC71] text-gray-800 px-3 py-2 rounded-lg text-xs font-bold transition hover:scale-[1.03] active:scale-[0.97] flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Open Tracker</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`Delete ${client.name}? All their data will be permanently deleted. This cannot be undone.`)) {
                          void onDeleteClient(client.id).then((err) => {
                            setRosterError(err ?? "");
                          });
                        }
                      }}
                      className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition hover:scale-105 active:scale-95 cursor-pointer"
                      title="Delete client and all their data"
                      aria-label="Delete client and all their data"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress toward THEIR goal - lost so far vs kg to lose */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      Goal Progress
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-900">
                      −{stats.total_weight_lost}
                      <span className="text-gray-400 font-medium"> of {goalKg} kg</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#2ECC71] h-full rounded-full transition-all duration-500"
                      style={{ width: `${goalPct}%` }}
                    />
                  </div>
                </div>

                {/* Is anything happening right now? */}
                <div className="flex flex-wrap items-center gap-2 border-t border-gray-50 pt-3">
                  {chip && (
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${chip.cls}`}>
                      {chip.label}
                    </span>
                  )}
                  {stats.program_status === "active" && (
                    <>
                      <span className="text-[10px] font-mono font-bold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                        <Dumbbell className="w-3 h-3 text-gray-400" />
                        {stats.week_workouts_completed}/{client.workout_frequency} workouts this week
                      </span>
                      <span className="text-[10px] font-mono font-bold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                        <Flame className="w-3 h-3 text-gray-400" />
                        {stats.week_days_logged}/{weekDaysElapsed} days logged
                      </span>
                    </>
                  )}
                </div>
              </div>
              );
            })}
          </div>

          {rosterLoading && (
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

        {/* Signup requests sidebar */}
        <div id="coach-requests-col">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
            <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3 flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-[#2ECC71]" />
              <span>Requests{requests.length > 0 ? ` (${requests.length})` : ""}</span>
            </h3>

            {requestsError && (
              <p className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
                {requestsError}
              </p>
            )}

            {requests.length === 0 && (
              <p className="text-xs text-gray-400 font-medium">
                No pending requests. New clients appear here when they sign up with Google.
              </p>
            )}

            <div className="space-y-3">
              {requests.map((request) => {
                const isApproving = approvingId === request.id;
                const isBusy = busyId === request.id;
                const declined = request.status === "declined";
                const detailsOpen = detailsId === request.id;
                // The decision-relevant numbers, precomputed: how much they
                // want to lose, and the weekly pace 12 weeks implies.
                const toLose = parseFloat((request.starting_weight - request.target_weight).toFixed(1));
                const weeklyPace = parseFloat((toLose / PROGRAM_WEEKS).toFixed(1));
                const aggressive = weeklyPace > 1;

                return (
                  <div
                    key={request.id}
                    className={`p-4 rounded-2xl border space-y-3 animate-fadeIn transition-opacity ${
                      declined ? "bg-gray-50 border-gray-200" : "bg-gray-50 border-gray-100"
                    } ${isBusy ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    {/* Who + when */}
                    <div className="flex justify-between items-center gap-2">
                      <p className="text-sm font-extrabold text-gray-900 truncate">{request.name}</p>
                      {declined ? (
                        <span className="text-[9px] text-gray-500 font-extrabold bg-gray-200 px-2 py-0.5 rounded uppercase shrink-0">
                          Declined
                        </span>
                      ) : (
                        request.requested_at && (
                          <span
                            className="text-[9px] text-gray-400 font-bold uppercase shrink-0"
                            title={request.requested_at.slice(0, 10)}
                          >
                            {requestedAgo(request.requested_at)}
                          </span>
                        )
                      )}
                    </div>

                    {/* The goal - the one thing the decision hinges on */}
                    <div className="flex items-center justify-between gap-2 bg-white rounded-xl border border-gray-100 px-3 py-2.5">
                      <span className="font-mono text-sm font-extrabold text-gray-900">
                        {request.starting_weight}
                        <span className="text-gray-300 mx-1.5">→</span>
                        {request.target_weight}
                        <span className="text-[10px] font-normal text-gray-400 ml-1">kg</span>
                      </span>
                      <span
                        className={`text-[10px] font-bold font-mono px-2 py-1 rounded-md shrink-0 ${
                          aggressive ? "bg-amber-100 text-amber-800" : "bg-[#2ECC71]/10 text-emerald-700"
                        }`}
                        title={`Losing ${toLose} kg in ${PROGRAM_WEEKS} weeks means ~${weeklyPace} kg per week${
                          aggressive ? " - an aggressive pace" : ""
                        }`}
                      >
                        −{toLose} kg · ~{weeklyPace}/wk
                      </span>
                    </div>

                    {/* Everything else on demand */}
                    <button
                      type="button"
                      onClick={() => setDetailsId(detailsOpen ? null : request.id)}
                      className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider transition cursor-pointer flex items-center gap-1"
                    >
                      Details
                      <ChevronDown
                        className={`w-3 h-3 transition-transform duration-200 ${detailsOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    <Expand open={detailsOpen} gap>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        {[
                          ["Age", `${request.age} yrs`],
                          ["Gender", request.gender],
                          ["Height", `${request.height} cm`],
                          ["BMR", `${request.bmr} kcal`]
                        ].map(([label, value]) => (
                          <div key={label} className="bg-white rounded-lg border border-gray-100 px-2.5 py-1.5">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
                            <p className="font-mono font-bold text-gray-900 mt-0.5">{value}</p>
                          </div>
                        ))}
                        <div className="bg-white rounded-lg border border-gray-100 px-2.5 py-1.5 col-span-2">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Email</p>
                          <p className="font-mono font-bold text-gray-900 mt-0.5 truncate">{request.email}</p>
                        </div>
                      </div>
                    </Expand>

                    <Expand open={isApproving} gap>
                      <form onSubmit={handleApprove} className="space-y-3 text-xs font-bold">
                        <div>
                          <label className="block text-gray-400 uppercase mb-1.5 text-[10px]">Program Start Date</label>
                          <input
                            type="date"
                            value={approveDate}
                            onChange={(e) => setApproveDate(e.target.value)}
                            className="w-full bg-white border border-gray-200 focus:border-[#2ECC71] text-gray-900 px-3 py-2 rounded-xl transition outline-none font-mono"
                            required
                          />
                          <p className="text-[10px] text-gray-400 mt-1 font-medium normal-case">
                            Week 1 begins on the Monday of the selected week.
                          </p>
                        </div>
                        <div>
                          <label className="block text-gray-400 uppercase mb-1.5 text-[10px]">Workouts Per Week</label>
                          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                            {([2, 3] as const).map((freq) => (
                              <button
                                key={freq}
                                type="button"
                                onClick={() => setApproveFreq(freq)}
                                className={`flex-1 py-2 uppercase tracking-wider transition cursor-pointer ${
                                  approveFreq === freq
                                    ? "bg-[#111111] text-[#2ECC71]"
                                    : "bg-white text-gray-500 hover:bg-gray-100"
                                }`}
                              >
                                {freq}-day
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            className="flex-1 bg-[#2ECC71] hover:bg-[#27ae60] text-[#111111] py-2 rounded-xl uppercase tracking-wider transition hover:scale-[1.02] active:scale-[0.97] flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            <CalendarCheck className="w-3.5 h-3.5" />
                            <span>Start Program</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setApprovingId(null)}
                            className="bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 px-4 py-2 rounded-xl uppercase tracking-wider transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </Expand>

                    <Expand open={!isApproving} gap>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => openApprove(request.id)}
                          className="flex-1 bg-[#111111] hover:bg-[#2ECC71] hover:text-[#111111] text-white py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition hover:scale-[1.02] active:scale-[0.97] flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        {!declined && (
                          <button
                            type="button"
                            onClick={() => void handleDecline(request.id)}
                            className="bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition hover:scale-[1.02] active:scale-[0.97] flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>
                        )}
                      </div>
                    </Expand>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
