import { User, DailyCalorie, WorkoutLog } from "../../types";
import { getProgramWeekDates } from "../../data";
import { Info } from "lucide-react";

interface WeeklyDeficitSummaryProps {
  user: User;
  allCalories: DailyCalorie[];
  allWorkouts: WorkoutLog[];
  viewWeek: number;
}

// Read-only summary of a week's numbers. Same for the client and the coach.
export default function WeeklyDeficitSummary({
  user,
  allCalories,
  allWorkouts,
  viewWeek
}: WeeklyDeficitSummaryProps) {
  const viewWeekDatesList = getProgramWeekDates(user, viewWeek).map((d) => d.date);
  const weeklyLogEntries = allCalories.filter(
    (c) => c.user_id === user.id && viewWeekDatesList.includes(c.date)
  );

  const totalCaloriesVal = weeklyLogEntries.reduce((sum, item) => sum + item.calories, 0);
  const loggedDaysCount = weeklyLogEntries.length;
  const averageCaloriesVal = loggedDaysCount > 0 ? Math.round(totalCaloriesVal / loggedDaysCount) : 0;

  const weeklyWorkouts = allWorkouts.filter(
    (w) => w.user_id === user.id && w.week === viewWeek && w.completed
  );
  const workoutBurnedVal = weeklyWorkouts.reduce((sum, u) => sum + u.calories_burned, 0);
  const dailyDeficitsSum = weeklyLogEntries.reduce((sum, log) => sum + (user.bmr - log.calories), 0);
  const totalWeeklyDeficit = dailyDeficitsSum + workoutBurnedVal;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs lg:col-span-2 space-y-6 flex flex-col justify-between" id="weekly-deficit-summary">
      <div>
        <h3 className="text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-3">
          Week {viewWeek} Summary
        </h3>

        <p className="text-xs text-gray-400 mt-2">
          Based on a daily target of {user.bmr} kcal (set by the coach).
        </p>

        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase">Total Calories</span>
            <span className="font-mono text-sm font-extrabold text-[#111111]">
              {totalCaloriesVal.toLocaleString()} <span className="text-xs font-normal">kcal</span>
            </span>
          </div>

          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase">Average Calories</span>
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
      </div>

      <div className="bg-amber-50 rounded-xl p-4 text-xs text-amber-800 border border-amber-100 space-y-1">
        <div className="flex items-center space-x-1.5 font-bold mb-1">
          <Info className="w-4 h-4 text-amber-600" />
          <span>How the deficit works</span>
        </div>
        <p className="leading-relaxed">
          Each logged day counts as {user.bmr} (the daily target) minus what was eaten. Completed
          workouts add their burn on top. Unlogged days count as zero.
        </p>
      </div>
    </div>
  );
}
