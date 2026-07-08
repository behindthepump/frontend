import React, { useState } from "react";
import { User, WorkoutLog } from "../../types";
import { WORKOUT_DEFINITIONS, formatShortDate } from "../../data";
import { CheckSquare, Square, Flame, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

type WorkoutName = "Lower Body" | "Upper Body Push" | "Upper Body Pull";

interface WorkoutListProps {
  user: User;
  allWorkouts: WorkoutLog[];
  viewWeek: number;
  currentWeekNum: number;
  isCurrentActiveWeek: boolean;
  onChangeWeek: (delta: number) => void;
  // Passing onToggle makes rows tappable (client). Omit for read-only (coach).
  onToggle?: (workoutName: WorkoutName) => Promise<string | null>;
}

export default function WorkoutList({
  user,
  allWorkouts,
  viewWeek,
  currentWeekNum,
  isCurrentActiveWeek,
  onChangeWeek,
  onToggle
}: WorkoutListProps) {
  const [togglingName, setTogglingName] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState("");

  const viewWeekWorkouts = allWorkouts.filter((w) => w.user_id === user.id && w.week === viewWeek);
  const getWorkoutLog = (name: string) => viewWeekWorkouts.find((w) => w.workout_name === name);

  const handleToggle = async (name: WorkoutName) => {
    if (!onToggle || togglingName) return;
    setTogglingName(name);
    setToggleError("");
    const error = await onToggle(name);
    setTogglingName(null);
    if (error) setToggleError(error);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs lg:col-span-3 space-y-4" id="weekly-workout-card">
      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">Week {viewWeek} Workouts</h2>
          <p className="text-xs text-gray-400 font-medium">
            {isCurrentActiveWeek ? "This week's 3 workouts" : "A past week"}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              onChangeWeek(-1);
              setToggleError("");
            }}
            disabled={viewWeek <= 1}
            title="Previous week"
            className="p-1.5 rounded-lg border border-gray-100 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
            Week {viewWeek}
          </span>
          <button
            type="button"
            onClick={() => {
              onChangeWeek(1);
              setToggleError("");
            }}
            disabled={viewWeek >= currentWeekNum}
            title="Next week"
            className="p-1.5 rounded-lg border border-gray-100 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {toggleError && (
        <p className="flex items-center space-x-2 text-xs text-red-600 font-bold bg-red-50 px-4 py-3 rounded-xl border border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{toggleError}</span>
        </p>
      )}

      <div className="space-y-3" id="workouts-list">
        {WORKOUT_DEFINITIONS.map((def) => {
          const logEntry = getWorkoutLog(def.name);
          const isCompleted = logEntry?.completed || false;

          return (
            <div
              key={def.name}
              onClick={onToggle ? () => void handleToggle(def.name) : undefined}
              className={`p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                onToggle ? "cursor-pointer group " : ""
              }${togglingName === def.name ? "opacity-50 pointer-events-none " : ""}${
                isCompleted
                  ? "bg-[#2ECC71]/10 border-[#2ECC71] text-gray-900"
                  : onToggle
                  ? "bg-gray-50 hover:bg-white border-gray-100 hover:border-gray-200 text-gray-800"
                  : "bg-gray-50 border-gray-100 text-gray-800"
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckSquare className="w-6 h-6 text-[#2ECC71]" />
                  ) : (
                    <Square className="w-6 h-6 text-gray-400 group-hover:text-gray-900 transition" />
                  )}
                </div>
                <div>
                  <h4 className="text-base font-extrabold">{def.name}</h4>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">Resistance Training</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold bg-white text-gray-600 px-3 py-1 border border-gray-100 rounded-full flex items-center space-x-1 shadow-2xs">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span>+{def.calories} kcal</span>
                </span>
                {isCompleted && logEntry?.completed_at && (
                  <span className="text-[10px] bg-[#2ECC71] text-[#111111] px-2 py-1 rounded-md font-bold font-mono">
                    Done {formatShortDate(logEntry.completed_at)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
