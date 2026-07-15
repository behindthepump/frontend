import React from "react";
import { User, DailyCalorie, WorkoutLog } from "../types";
import {
  UserCalculations,
  getProgramWeekDates,
  todayStr,
  formatShortDate,
  PROGRAM_WEEKS,
  WEEKLY_GOAL
} from "../data";
import { paceDelta } from "./coach/PaceTrack";
import DotMeter from "./coach/DotMeter";
import CountUp from "./coach/CountUp";
import { Flame, Scale, TrendingUp, Dumbbell, Calendar, ChevronRight, Pencil } from "lucide-react";

interface DashboardProps {
  user: User;
  calculations: UserCalculations;
  allCalories: DailyCalorie[];
  allWorkouts: WorkoutLog[];
  subtitle: string;
  cta: React.ReactNode; // the state-aware "up next" card (ClientCtaCard)
  onNavigate: (tab: string) => void;
}

// The client's daily briefing, in priority order: act (Today card), am I on
// track (KPIs with pace), this week (instruments), the long arc (timeline).
export default function Dashboard({
  user,
  calculations,
  allCalories,
  allWorkouts,
  subtitle,
  cta,
  onNavigate
}: DashboardProps) {
  const {
    currentWeight,
    totalWeightLost,
    workoutCompletionCount,
    totalWorkouts,
    currentWeekNum,
    programStatus,
    weeklySummaries,
    overallProgressPercent
  } = calculations;

  const today = todayStr();
  const firstName = user.name.trim().split(/\s+/)[0] || user.name;

  // Today's state - the screen's number one job
  const todayEntry = allCalories.find((c) => c.user_id === user.id && c.date === today);
  const eatenToday = todayEntry?.calories ?? 0;
  const deficitToday = user.bmr - eatenToday;

  // This week's numbers
  const thisWeekSummary = weeklySummaries.find((s) => s.week === currentWeekNum) || {
    calories_burned: 0,
    weight_lost: 0,
    deficit: 0
  };
  const currentWeekDateStrs = getProgramWeekDates(user, currentWeekNum).map((d) => d.date);
  const currentWeekCalories = allCalories.filter(
    (c) => c.user_id === user.id && currentWeekDateStrs.includes(c.date)
  );
  const totalConsumedThisWeek = currentWeekCalories.reduce((sum, item) => sum + item.calories, 0);
  const daysLoggedThisWeek = currentWeekCalories.filter((c) => c.date <= today).length;
  const dow = new Date().getDay();
  const weekDaysElapsed = dow === 0 ? 7 : dow;
  // Sessions against the soft weekly goal ("Personal" is kcal, not a session)
  const weekWorkoutsDone = allWorkouts.filter(
    (w) => w.user_id === user.id && w.week === currentWeekNum && w.completed && w.workout_name !== "Personal"
  ).length;

  // Pace verdict - same math the coach sees, client-voiced
  const goalKg = parseFloat((user.starting_weight - user.target_weight).toFixed(1));
  const paceWeek = programStatus === "completed" ? 12 : programStatus === "active" ? currentWeekNum : 0;
  const pace = paceDelta(goalKg, totalWeightLost, paceWeek);

  const barLabel =
    programStatus === "not_started"
      ? "Not Started"
      : programStatus === "completed"
      ? "Complete"
      : `Week ${currentWeekNum}`;
  const remainingWeeks = programStatus === "not_started" ? PROGRAM_WEEKS : PROGRAM_WEEKS - currentWeekNum;

  return (
    <div className="space-y-6 animate-fadeIn" id="dashboard-screen">
      {/* Header: greeting + program state. No giant self-name - the week is
          the information */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" id="dashboard-header">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Hey, {firstName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-2 bg-[#111111] text-white px-5 py-3 rounded-xl border border-gray-800 shadow-sm shrink-0">
          <Calendar className="w-5 h-5 text-[#A66A00]" />
          <span className="font-mono text-sm font-semibold uppercase tracking-wider">
            {programStatus === "not_started"
              ? `Starts ${user.program_start_date}`
              : programStatus === "completed"
              ? `Completed • ${PROGRAM_WEEKS} Weeks`
              : `Week ${currentWeekNum} of ${PROGRAM_WEEKS}`}
          </span>
        </div>
      </div>

      {/* TODAY - what do I need to do right now? Only exists while the
          program is running */}
      {programStatus === "active" && (
        <div className="bg-[#111111] p-6 rounded-2xl text-white border border-gray-800" id="today-card">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Today · {formatShortDate(today)}
              </p>
              <p className="text-3xl leading-none font-black font-mono mt-2">
                <CountUp value={eatenToday} />
                <span className="text-sm text-gray-500 font-bold"> / {user.bmr.toLocaleString()} kcal</span>
              </p>
              <p className="text-xs mt-2 font-medium">
                {!todayEntry ? (
                  <span className="text-gray-400">Nothing logged yet — your body burns {user.bmr.toLocaleString()} kcal at rest</span>
                ) : deficitToday >= 0 ? (
                  <span className="text-[#FEC63F] font-bold">{deficitToday.toLocaleString()} kcal deficit so far — keep it up</span>
                ) : (
                  <span className="text-orange-400 font-bold">{(-deficitToday).toLocaleString()} kcal over your resting burn</span>
                )}
              </p>
            </div>

            <button
              onClick={() => onNavigate("daily")}
              className="bg-[#FEC63F] hover:bg-[#F0B41E] text-[#111111] font-extrabold text-xs py-2.5 px-5 rounded-xl uppercase tracking-wider transition hover:scale-[1.02] active:scale-[0.97] flex items-center space-x-2 cursor-pointer shrink-0"
            >
              {todayEntry ? <Pencil className="w-3.5 h-3.5" /> : <Flame className="w-3.5 h-3.5" />}
              <span>{todayEntry ? "Update Today's Log" : "Log Today"}</span>
            </button>
          </div>

          {/* Budget bar: how far into the resting burn today's eating is */}
          <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden mt-4">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                deficitToday >= 0 ? "bg-[#FEC63F]" : "bg-orange-400"
              }`}
              style={{ width: `${Math.min(100, Math.round((eatenToday / user.bmr) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* KPI Cards: am I on track? */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="kpi-cards-grid">
        <div
          onClick={() => onNavigate("profile")}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:border-[#FEC63F]/40 transition duration-250 cursor-pointer group"
          id="kpi-card-weight"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estimated Weight</p>
              <h3 className="text-3xl font-extrabold text-[#111111] mt-2 font-mono" id="weight-value">
                <CountUp value={currentWeight} /> <span className="text-sm font-normal text-gray-500">kg</span>
              </h3>
            </div>
            <div className="bg-gray-50 group-hover:bg-[#FEC63F]/10 p-3 rounded-xl transition">
              <Scale className="w-6 h-6 text-gray-400 group-hover:text-[#A66A00] transition" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-400">
            Started at {user.starting_weight} kg
          </div>
        </div>

        <div
          onClick={() => onNavigate("progress")}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:border-[#FEC63F]/40 transition duration-250 cursor-pointer group"
          id="kpi-card-weight-loss"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Weight Lost</p>
              <h3 className="text-3xl font-extrabold text-[#A66A00] mt-2 font-mono" id="weight-loss-value">
                <CountUp value={totalWeightLost} /> <span className="text-sm font-normal text-gray-500">of {goalKg} kg</span>
              </h3>
            </div>
            <div className="bg-[#FEC63F]/10 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-[#A66A00]" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 text-xs text-gray-400">
            <span>Goal: {user.target_weight} kg</span>
            {pace && (
              <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-[10px] ${pace.cls}`}>
                {pace.label}
              </span>
            )}
          </div>
        </div>

        <div
          onClick={() => onNavigate("workout")}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:border-[#FEC63F]/40 transition duration-250 cursor-pointer group"
          id="kpi-card-workouts"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Workouts Done</p>
              <h3 className="text-3xl font-extrabold text-gray-900 mt-2 font-mono" id="workouts-value">
                <CountUp value={workoutCompletionCount} /> <span className="text-sm font-normal text-gray-500">/ {totalWorkouts}</span>
              </h3>
            </div>
            <div className="bg-gray-50 group-hover:bg-[#FEC63F]/10 p-3 rounded-xl transition">
              <Dumbbell className="w-6 h-6 text-gray-400 group-hover:text-[#A66A00] transition" />
            </div>
          </div>
          <div className="mt-4 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#111111] h-full transition-all duration-500"
              style={{ width: `${totalWorkouts > 0 ? Math.round((workoutCompletionCount / totalWorkouts) * 100) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* This week + up-next slot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-lower-grid">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs lg:col-span-2 space-y-5" id="weekly-snapshot-card">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">This Week</h2>
              <p className="text-xs text-gray-400">
                {programStatus === "not_started"
                  ? "The program hasn't started yet"
                  : programStatus === "completed"
                  ? `Final week summary (Week ${PROGRAM_WEEKS})`
                  : `Week ${currentWeekNum} so far`}
              </p>
            </div>
            <button
              onClick={() => onNavigate("progress")}
              className="text-[#A66A00] hover:text-[#F0B41E] text-xs font-semibold flex items-center transition cursor-pointer"
            >
              View All Weeks <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {programStatus === "not_started" ? (
            <p className="text-xs text-gray-400 py-4">
              Your weekly numbers appear here once the program starts on {user.program_start_date}.
            </p>
          ) : (
            <>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Deficit so far</p>
                <p
                  className={`text-3xl leading-none font-black font-mono mt-1.5 ${
                    thisWeekSummary.deficit < 0 ? "text-orange-500" : "text-gray-900"
                  }`}
                >
                  <CountUp value={thisWeekSummary.deficit} />
                  <span className="text-sm text-gray-400 font-bold"> kcal</span>
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {totalConsumedThisWeek.toLocaleString()} kcal eaten · {thisWeekSummary.calories_burned.toLocaleString()} kcal
                  burned in workouts · every 7,700 kcal ≈ 1 kg
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-gray-50 pt-4">
                <DotMeter
                  Icon={Flame}
                  filled={Math.min(daysLoggedThisWeek, weekDaysElapsed)}
                  total={weekDaysElapsed}
                  title={`${daysLoggedThisWeek} of ${weekDaysElapsed} days logged this week`}
                />
                <DotMeter
                  Icon={Dumbbell}
                  filled={Math.min(weekWorkoutsDone, WEEKLY_GOAL)}
                  total={WEEKLY_GOAL}
                  title={`${weekWorkoutsDone} of ${WEEKLY_GOAL} workouts done this week`}
                />
                <span className="text-[10px] text-gray-400 font-medium">days logged · workouts</span>
              </div>
            </>
          )}
        </div>

        {cta}
      </div>

      {/* The long arc */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs" id="progress-bar-container">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-bold text-gray-900">Program Timeline</p>
          <span className="text-sm font-extrabold text-[#A66A00] font-mono">{overallProgressPercent}%</span>
        </div>
        <div className="w-full bg-gray-100 h-8 rounded-xl p-1 flex items-center overflow-hidden font-mono text-xs">
          <div
            className="bg-[#111111] h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2 text-[#FEC63F] font-bold"
            style={{ width: `${overallProgressPercent}%` }}
          >
            {overallProgressPercent >= 15 && barLabel}
          </div>
          <div className="flex-1 flex justify-between items-center px-3 text-gray-400 font-bold select-none">
            <span>{overallProgressPercent < 15 ? barLabel : ""}</span>
            <span>
              {remainingWeeks === 0 ? "Done" : `${remainingWeeks} ${remainingWeeks === 1 ? "week" : "weeks"} left`}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-right">
          Goal: {user.target_weight} kg • Duration: 12 Weeks total
        </p>
      </div>
    </div>
  );
}
