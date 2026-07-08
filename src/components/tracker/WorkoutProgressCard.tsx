import React from "react";
import { User, WorkoutLog } from "../../types";
import { WORKOUT_DEFINITIONS, PROGRAM_WEEKS } from "../../data";
import { Trophy } from "lucide-react";

interface WorkoutProgressCardProps {
  user: User;
  allWorkouts: WorkoutLog[];
  // Composing view supplies the footer note (client: how to uncheck; coach:
  // read-only hint).
  footer: React.ReactNode;
}

export default function WorkoutProgressCard({ user, allWorkouts, footer }: WorkoutProgressCardProps) {
  const userWorkouts = allWorkouts.filter((w) => w.user_id === user.id);
  const totalWorkoutsCount = PROGRAM_WEEKS * WORKOUT_DEFINITIONS.length;
  const completedWorkouts = userWorkouts.filter((w) => w.completed);
  const completedWorkoutsCount = completedWorkouts.length;
  const totalBurned = completedWorkouts.reduce((sum, w) => sum + w.calories_burned, 0);
  const progressPercent = Math.round((completedWorkoutsCount / totalWorkoutsCount) * 100);

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs lg:col-span-2 space-y-6 flex flex-col justify-between font-sans" id="workout-progress-card">
      <div>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Program Progress</h3>

        <div className="space-y-4">
          <div className="flex justify-between items-baseline">
            <span className="text-4xl font-black text-gray-900 font-mono" id="progress-digits">
              {completedWorkoutsCount} <span className="text-sm font-normal text-gray-400">/ {totalWorkoutsCount}</span>
            </span>
            <span className="text-sm font-black text-[#2ECC71] font-mono bg-[#2ECC71]/10 px-3 py-1 rounded-full">
              {progressPercent}% Done
            </span>
          </div>

          <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden">
            <div className="bg-[#111111] h-full transition-all duration-400" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="mt-8 space-y-4 border-t border-gray-100 pt-6">
          <div className="flex items-center space-x-3 text-sm">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-extrabold text-gray-900">Total Burned</h5>
              <p className="text-xs text-gray-400">
                {totalBurned.toLocaleString()} kcal earned from completed workouts
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-500 leading-relaxed flex items-start space-x-2">
        {footer}
      </div>
    </div>
  );
}
