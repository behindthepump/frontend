import { useState } from "react";
import { User, DailyCalorie, WorkoutLog } from "../../types";
import { getProgramWeekDates, todayStr as getTodayStr } from "../../data";
import Expand from "../Expand";
import DotMeter from "../coach/DotMeter";
import { Info, ChevronDown, Flame } from "lucide-react";

interface WeeklyDeficitSummaryProps {
  user: User;
  allCalories: DailyCalorie[];
  allWorkouts: WorkoutLog[];
  viewWeek: number;
}

// A week's numbers, led by the one that matters: what the deficit earns in
// kilograms. The math explainer collapses behind a toggle.
export default function WeeklyDeficitSummary({
  user,
  allCalories,
  allWorkouts,
  viewWeek
}: WeeklyDeficitSummaryProps) {
  const [mathOpen, setMathOpen] = useState(false);
  const today = getTodayStr();

  const viewWeekDates = getProgramWeekDates(user, viewWeek).map((d) => d.date);
  const weeklyLogEntries = allCalories.filter(
    (c) => c.user_id === user.id && viewWeekDates.includes(c.date)
  );

  const loggedDaysCount = weeklyLogEntries.length;
  const daysElapsedInWeek = viewWeekDates.filter((d) => d <= today).length;
  const totalCaloriesVal = weeklyLogEntries.reduce((sum, item) => sum + item.calories, 0);
  const averageCaloriesVal = loggedDaysCount > 0 ? Math.round(totalCaloriesVal / loggedDaysCount) : 0;

  const weeklyWorkouts = allWorkouts.filter(
    (w) => w.user_id === user.id && w.week === viewWeek && w.completed
  );
  const workoutBurnedVal = weeklyWorkouts.reduce((sum, u) => sum + u.calories_burned, 0);
  const dailyDeficitsSum = weeklyLogEntries.reduce((sum, log) => sum + (user.bmr - log.calories), 0);
  const totalWeeklyDeficit = dailyDeficitsSum + workoutBurnedVal;

  // The payoff: same 7,700 kcal ≈ 1 kg conversion used everywhere else
  const estKgLost = totalWeeklyDeficit > 0 ? parseFloat((totalWeeklyDeficit / 7700).toFixed(2)) : 0;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs lg:col-span-2 space-y-5" id="weekly-deficit-summary">
      <h3 className="text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-3">
        Week {viewWeek} Summary
      </h3>

      {/* What this week earns */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          Estimated loss this week
        </p>
        <p className="text-3xl leading-none font-black font-mono text-[#2ECC71] mt-1.5">
          ≈ {estKgLost} <span className="text-sm text-gray-400 font-bold">kg</span>
        </p>
        {totalWeeklyDeficit < 0 && (
          <p className="text-[11px] text-orange-500 font-bold mt-1.5">
            The week is in surplus so far — a workout or a lighter day turns it around.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
          <span className="text-xs font-bold text-gray-500 uppercase">Days Logged</span>
          <DotMeter
            Icon={Flame}
            filled={Math.min(loggedDaysCount, daysElapsedInWeek)}
            total={Math.max(daysElapsedInWeek, 1)}
            title={`${loggedDaysCount} of ${daysElapsedInWeek} days logged`}
          />
        </div>

        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
          <span className="text-xs font-bold text-gray-500 uppercase">Avg Per Logged Day</span>
          <span className="font-mono text-sm font-extrabold text-[#111111]">
            {averageCaloriesVal.toLocaleString()} <span className="text-xs font-normal">kcal</span>
          </span>
        </div>

        <div
          className={`flex justify-between items-center p-3 rounded-xl border ${
            totalWeeklyDeficit >= 0 ? "bg-green-50/50 border-green-100" : "bg-orange-50 border-orange-100"
          }`}
        >
          <span className="text-xs font-bold text-gray-500 uppercase">Weekly Deficit</span>
          <span
            className={`font-mono text-sm font-extrabold ${
              totalWeeklyDeficit >= 0 ? "text-[#2ECC71]" : "text-orange-500"
            }`}
          >
            {totalWeeklyDeficit.toLocaleString()} <span className="text-xs font-normal">kcal</span>
          </span>
        </div>
      </div>

      {/* The math, one tap away */}
      <div>
        <button
          type="button"
          onClick={() => setMathOpen((o) => !o)}
          className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider transition cursor-pointer flex items-center gap-1"
        >
          <Info className="w-3 h-3" />
          How the deficit works
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 ${mathOpen ? "rotate-180" : ""}`}
          />
        </button>
        <Expand open={mathOpen}>
          <p className="text-xs text-gray-500 leading-relaxed pt-2">
            Each logged day counts as your daily budget of {user.bmr.toLocaleString()} kcal (your BMR —
            what your body burns at rest) minus what you ate. Completed workouts add their burn on
            top, and every 7,700 kcal of deficit ≈ 1 kg lost. Unlogged days count as zero, so logging
            protects your progress.
          </p>
        </Expand>
      </div>
    </div>
  );
}
