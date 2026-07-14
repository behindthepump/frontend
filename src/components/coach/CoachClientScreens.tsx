import { useState } from "react";
import { User, DailyCalorie, WorkoutLog } from "../../types";
import {
  calculateUserStats,
  getProgramWeekDates,
  todayStr,
  formatShortDate,
  PROGRAM_WEEKS,
  WEEKLY_GOAL
} from "../../data";
import { recency, RECENCY_CHIP_DARK } from "./recency";
import { ClipboardList, User as UserIcon, Dumbbell, Flame } from "lucide-react";
import Profile from "../Profile";
import CoachClientReport from "./CoachClientReport";
import PaceTrack, { paceDelta } from "./PaceTrack";
import CountUp from "./CountUp";
import RingAvatar from "./RingAvatar";
import DotMeter from "./DotMeter";

const TABS = [
  { id: "report", label: "Report", Icon: ClipboardList },
  { id: "profile", label: "Profile", Icon: UserIcon }
] as const;

interface CoachClientScreensProps {
  user: User;
  allCalories: DailyCalorie[];
  allWorkouts: WorkoutLog[];
  onUpdateUser: (updatedUser: User) => Promise<string | null>;
  onDelete: () => Promise<string | null>;
}

// The coach's drill-in is its own lens - a monitoring report, not the
// client's tracker screens. The client identity header persists across both
// modes; the Report/Profile switch lives inside it, so the app's main nav
// never changes while drilled in.
export default function CoachClientScreens({
  user,
  allCalories,
  allWorkouts,
  onUpdateUser,
  onDelete
}: CoachClientScreensProps) {
  const [tab, setTab] = useState<"report" | "profile">("report");

  const stats = calculateUserStats(user, allCalories, allWorkouts);
  const today = todayStr();
  const goalKg = parseFloat((user.starting_weight - user.target_weight).toFixed(1));
  const goalPct = goalKg > 0 ? Math.min(100, Math.round((stats.totalWeightLost / goalKg) * 100)) : 0;
  const week =
    stats.programStatus === "completed"
      ? 12
      : stats.programStatus === "active"
      ? stats.currentWeekNum
      : 0;
  const pace = paceDelta(goalKg, stats.totalWeightLost, week);
  const goalFraction = goalKg > 0 ? Math.min(1, stats.totalWeightLost / goalKg) : 0;

  // Same urgency scale as the roster cards, so a client opened from an
  // amber card stays amber here.
  const rec = recency(stats.programStatus, stats.lastLoggedDate);

  // This week's leading indicators (same meters as the roster card)
  const isActive = stats.programStatus === "active";
  let weekWorkoutsDone = 0;
  let weekDaysLogged = 0;
  let weekDaysElapsed = 0;
  if (isActive) {
    weekWorkoutsDone = allWorkouts.filter(
      (w) =>
        w.user_id === user.id &&
        w.week === stats.currentWeekNum &&
        w.completed &&
        w.workout_name !== "Personal"
    ).length;
    const loggedDates = new Set(
      allCalories.filter((c) => c.user_id === user.id).map((c) => c.date)
    );
    weekDaysLogged = getProgramWeekDates(user, stats.currentWeekNum).filter(
      ({ date }) => date <= today && loggedDates.has(date)
    ).length;
    const dow = new Date().getDay();
    weekDaysElapsed = dow === 0 ? 7 : dow;
  }

  return (
    <div className="space-y-6 animate-fadeIn" id="coach-client-screens">
      {/* Persistent header: who, where they are, goal trajectory, mode switch */}
      <div className="relative overflow-hidden bg-[#111111] p-6 rounded-2xl text-white border border-gray-800">
        {/* Ghost week numeral - pure typography, zero clutter */}
        {week > 0 && (
          <span
            aria-hidden
            className="absolute -bottom-10 -right-1 text-[7.5rem] leading-none font-black font-mono text-white/[0.05] pointer-events-none select-none"
          >
            W{week}
          </span>
        )}
        {/* Identity zone: the chip is information about the client, so it
            rides the meta line; the toggle stands alone as the only control */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <RingAvatar name={user.name} pct={goalFraction} />
            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tight truncate">{user.name}</h1>
              <p className="text-xs text-gray-400 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>
                  {stats.programStatus === "not_started"
                    ? `Program starts ${user.program_start_date}`
                    : stats.programStatus === "completed"
                    ? "Program complete • 12 weeks"
                    : `Week ${stats.currentWeekNum} of ${PROGRAM_WEEKS} • started ${formatShortDate(user.program_start_date)}`}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${RECENCY_CHIP_DARK[rec.key]}`}>
                  {rec.label}
                </span>
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <div className="flex rounded-xl bg-gray-900 border border-gray-800 p-1">
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition cursor-pointer ${
                    tab === id
                      ? "bg-[#2ECC71] text-[#111111]"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stat zone: the same hero the roster card leads with, at header
            scale - big lost number, pace verdict, track, this week */}
        <div className="mt-5 pt-5 border-t border-gray-800/80">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                Lost so far
              </p>
              <p className="text-3xl leading-none font-black font-mono mt-1.5">
                {stats.totalWeightLost > 0 ? (
                  <>
                    −<CountUp value={stats.totalWeightLost} />
                  </>
                ) : (
                  "0"
                )}
                <span className="text-sm text-gray-500 font-bold"> / {goalKg} kg</span>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {pace && (
                <span className={`text-[10px] font-bold font-mono px-2 py-1 rounded-md ${pace.clsDark}`}>
                  {pace.label}
                </span>
              )}
              <span className="text-[#2ECC71] font-mono font-bold text-sm">
                <CountUp value={goalPct} />%
              </span>
            </div>
          </div>

          <div className="mt-3">
            <PaceTrack dark goalKg={goalKg} lost={stats.totalWeightLost} week={week} />
          </div>

          {/* This week's leading indicators - carried over from the roster
              card so drilling in never loses information */}
          {isActive && (
            <div className="flex items-center gap-5 mt-4">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                This Week
              </span>
              <DotMeter
                dark
                Icon={Dumbbell}
                filled={Math.min(weekWorkoutsDone, WEEKLY_GOAL)}
                total={WEEKLY_GOAL}
                title={`${weekWorkoutsDone} of ${WEEKLY_GOAL} workouts this week`}
              />
              <DotMeter
                dark
                Icon={Flame}
                filled={Math.min(weekDaysLogged, weekDaysElapsed)}
                total={weekDaysElapsed}
                title={`${weekDaysLogged} of ${weekDaysElapsed} days logged this week`}
              />
            </div>
          )}
        </div>
      </div>

      {tab === "profile" ? (
        <div className="animate-fadeIn">
          <Profile
            user={user}
            canEdit={true}
            goalProgress={goalFraction}
            onUpdateUser={onUpdateUser}
            onDelete={onDelete}
          />
        </div>
      ) : (
        <CoachClientReport user={user} allCalories={allCalories} allWorkouts={allWorkouts} />
      )}
    </div>
  );
}
