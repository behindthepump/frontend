import React from "react";
import { User, DailyCalorie } from "../types";
import { UserCalculations, getProgramWeekDates, PROGRAM_WEEKS } from "../data";
import { Flame, Scale, TrendingUp, Dumbbell, Calendar, ChevronRight } from "lucide-react";

interface DashboardProps {
  user: User;
  calculations: UserCalculations;
  allCalories: DailyCalorie[];
  // Composed per role: the header line and the bottom-right call-to-action card.
  subtitle: string;
  cta: React.ReactNode;
  onNavigate: (tab: string) => void;
}

// Shared stats surface (KPIs, timeline, weekly snapshot). The client and the
// coach pass their own subtitle + CTA; everything else is identical read-only.
export default function Dashboard({
  user,
  calculations,
  allCalories,
  subtitle,
  cta,
  onNavigate
}: DashboardProps) {
  const {
    currentWeight,
    totalCalorieDeficit,
    totalWeightLost,
    workoutCompletionCount,
    totalWorkouts,
    currentWeekNum,
    programStatus,
    weeklySummaries,
    overallProgressPercent
  } = calculations;

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

  const barLabel =
    programStatus === "not_started"
      ? "Not Started"
      : programStatus === "completed"
      ? "Complete"
      : `Week ${currentWeekNum}`;
  const remainingWeeks = programStatus === "not_started" ? PROGRAM_WEEKS : PROGRAM_WEEKS - currentWeekNum;

  return (
    <div className="space-y-8 animate-fadeIn" id="dashboard-screen">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-xs" id="dashboard-header">
        <div>
          <span className="text-xs font-semibold text-[#2ECC71] tracking-wider uppercase bg-[#2ECC71]/10 px-3 py-1 rounded-full">
            {programStatus === "not_started"
              ? "Starting Soon"
              : programStatus === "completed"
              ? "Program Complete"
              : "In Progress"}
          </span>
          <h1 className="text-3xl font-black text-gray-900 mt-2 tracking-tight" id="client-name">
            {user.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2 bg-[#111111] text-white px-5 py-3 rounded-xl border border-gray-800 shadow-sm">
          <Calendar className="w-5 h-5 text-[#2ECC71]" />
          <span className="font-mono text-sm font-semibold uppercase tracking-wider">
            {programStatus === "not_started"
              ? `Starts ${user.program_start_date}`
              : programStatus === "completed"
              ? `Completed • ${PROGRAM_WEEKS} Weeks`
              : `Week ${currentWeekNum} of ${PROGRAM_WEEKS}`}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards-grid">
        <div
          onClick={() => onNavigate("profile")}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:border-[#2ECC71]/40 transition duration-250 cursor-pointer group relative overflow-hidden"
          id="kpi-card-weight"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estimated Weight</p>
              <h3 className="text-3xl font-extrabold text-[#111111] mt-2 font-mono" id="weight-value">
                {currentWeight} <span className="text-sm font-normal text-gray-500">kg</span>
              </h3>
            </div>
            <div className="bg-gray-50 group-hover:bg-[#2ECC71]/10 p-3 rounded-xl transition">
              <Scale className="w-6 h-6 text-gray-400 group-hover:text-[#2ECC71] transition" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-500">
            <span className="text-gray-400">Starting weight: {user.starting_weight} kg</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate("progress")}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:border-[#2ECC71]/40 transition duration-250 cursor-pointer group relative overflow-hidden"
          id="kpi-card-weight-loss"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estimated Weight Lost</p>
              <h3 className="text-3xl font-extrabold text-[#2ECC71] mt-2 font-mono" id="weight-loss-value">
                {totalWeightLost} <span className="text-sm font-normal text-gray-500">kg</span>
              </h3>
            </div>
            <div className="bg-[#2ECC71]/10 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-[#2ECC71]" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-500">
            <span className="text-[#2ECC71] font-semibold mr-1">Target Loss:</span>
            <span className="font-mono font-medium">
              {parseFloat((user.starting_weight - user.target_weight).toFixed(1))} kg
            </span>
          </div>
        </div>

        <div
          onClick={() => onNavigate("daily")}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:border-[#2ECC71]/40 transition duration-250 cursor-pointer group relative overflow-hidden"
          id="kpi-card-calorie-deficit"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Deficit</p>
              <h3 className="text-3xl font-extrabold text-gray-900 mt-2 font-mono" id="deficit-value">
                {totalCalorieDeficit.toLocaleString()} <span className="text-sm font-normal text-gray-500">kcal</span>
              </h3>
            </div>
            <div className="bg-gray-50 group-hover:bg-[#2ECC71]/10 p-3 rounded-xl transition">
              <Flame className="w-6 h-6 text-gray-400 group-hover:text-[#2ECC71] transition" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-500">
            <span className="text-gray-400">Since Week 1 — every 7,700 kcal ≈ 1 kg</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate("workout")}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:border-[#2ECC71]/40 transition duration-250 cursor-pointer group relative overflow-hidden"
          id="kpi-card-workouts"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Workout Completion</p>
              <h3 className="text-3xl font-extrabold text-gray-900 mt-2 font-mono" id="workouts-value">
                {workoutCompletionCount} <span className="text-sm font-normal text-gray-500">/ {totalWorkouts}</span>
              </h3>
            </div>
            <div className="bg-gray-50 group-hover:bg-[#2ECC71]/10 p-3 rounded-xl transition">
              <Dumbbell className="w-6 h-6 text-gray-400 group-hover:text-[#2ECC71] transition" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-500">
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#111111] h-full"
                style={{ width: `${Math.round((workoutCompletionCount / totalWorkouts) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Program Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs" id="progress-bar-container">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-bold text-gray-900">Program Timeline</p>
          <span className="text-sm font-extrabold text-[#2ECC71] font-mono">{overallProgressPercent}%</span>
        </div>
        <div className="w-full bg-gray-100 h-8 rounded-xl p-1 flex items-center overflow-hidden font-mono text-xs">
          <div
            className="bg-[#111111] h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2 text-[#2ECC71] font-bold"
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

      {/* Weekly Snapshot + CTA slot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-lower-grid">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs lg:col-span-2 space-y-4" id="weekly-snapshot-card">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">Weekly Snapshot</h2>
              <p className="text-xs text-gray-400">
                {programStatus === "not_started"
                  ? "The program hasn't started yet"
                  : programStatus === "completed"
                  ? `Final week summary (Week ${PROGRAM_WEEKS})`
                  : `Numbers for Week ${currentWeekNum} so far`}
              </p>
            </div>
            <button
              onClick={() => onNavigate("progress")}
              className="text-[#2ECC71] hover:text-[#27ae60] text-xs font-semibold flex items-center transition"
            >
              View All Weeks <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Metric</th>
                  <th className="py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-mono text-sm font-semibold">
                <tr>
                  <td className="py-3 text-gray-600">Calories Consumed</td>
                  <td className="py-3 text-gray-900 text-right">{totalConsumedThisWeek.toLocaleString()} kcal</td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600">Workout Calories Burned</td>
                  <td className="py-3 text-[#2ECC71] text-right">{thisWeekSummary.calories_burned} kcal</td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600">Deficit</td>
                  <td className={`py-3 text-right ${thisWeekSummary.deficit < 0 ? "text-orange-500" : "text-gray-900"}`}>
                    {thisWeekSummary.deficit.toLocaleString()} kcal
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600">Est. Weight Lost</td>
                  <td className="py-3 text-blue-500 text-right">{thisWeekSummary.weight_lost} kg</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {cta}
      </div>
    </div>
  );
}
