import React from "react";
import { User, WorkoutLog } from "../../types";
import { PROGRAM_WEEKS, WEEKLY_GOAL } from "../../data";
import DotMeter from "../coach/DotMeter";
import CountUp from "../coach/CountUp";
import { Trophy, Dumbbell } from "lucide-react";

interface WorkoutProgressCardProps {
  user: User;
  allWorkouts: WorkoutLog[];
  viewWeek: number;
  // Composing view supplies the footer note (client: the locking rules).
  footer: React.ReactNode;
}

// The viewed week first (sessions + burn), the whole program second - the
// dashboard already owns the cumulative story.
export default function WorkoutProgressCard({ user, allWorkouts, viewWeek, footer }: WorkoutProgressCardProps) {
  const userWorkouts = allWorkouts.filter((w) => w.user_id === user.id);
  const weekCompleted = userWorkouts.filter((w) => w.week === viewWeek && w.completed);
  const weekBurned = weekCompleted.reduce((sum, w) => sum + w.calories_burned, 0);
  // Burn counts everything (incl. the "Personal" weekly entry); session
  // counts track coach sets only against the soft weekly goal.
  const weekSessions = weekCompleted.filter((w) => w.workout_name !== "Personal").length;

  const totalWorkoutsCount = PROGRAM_WEEKS * WEEKLY_GOAL;
  const completedWorkouts = userWorkouts.filter((w) => w.completed);
  const completedSessions = completedWorkouts.filter((w) => w.workout_name !== "Personal").length;
  const totalBurned = completedWorkouts.reduce((sum, w) => sum + w.calories_burned, 0);
  const progressPercent = Math.min(100, Math.round((completedSessions / totalWorkoutsCount) * 100));

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs lg:col-span-2 space-y-5 flex flex-col justify-between" id="workout-progress-card">
      <div className="space-y-5">
        {/* The viewed week's story */}
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            Week {viewWeek} Burn
          </h3>
          <p className="text-3xl leading-none font-black font-mono text-gray-900 mt-2">
            +<CountUp value={weekBurned} /> <span className="text-sm text-gray-400 font-bold">kcal</span>
          </p>
          <p className="text-xs text-gray-400 mt-1.5">
            Added on top of your daily deficits this week
          </p>
          <div className="flex items-center gap-3 mt-3">
            <DotMeter
              Icon={Dumbbell}
              filled={Math.min(weekSessions, WEEKLY_GOAL)}
              total={WEEKLY_GOAL}
              title={`${weekSessions} of ${WEEKLY_GOAL} sessions done in week ${viewWeek}`}
            />
            <span className="text-[10px] text-gray-400 font-medium">
              {weekSessions} of {WEEKLY_GOAL} sessions
            </span>
          </div>
        </div>

        {/* The whole program, compact */}
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500 uppercase">Program</span>
            <span className="font-mono text-sm font-extrabold text-gray-900">
              {completedSessions}
              <span className="text-xs font-normal text-gray-400"> / {totalWorkoutsCount} · {progressPercent}%</span>
            </span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div className="bg-[#111111] h-full transition-all duration-400" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{totalBurned.toLocaleString()} kcal burned across the program</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-500 leading-relaxed flex items-start space-x-2">
        {footer}
      </div>
    </div>
  );
}
