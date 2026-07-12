import { useState } from "react";
import { User, WorkoutLog, WorkoutName } from "../../types";
import { getProgramStatus, getCurrentWeekNum } from "../../data";
import WorkoutList from "../tracker/WorkoutList";
import WorkoutProgressCard from "../tracker/WorkoutProgressCard";
import NotStartedNotice from "../tracker/NotStartedNotice";
import { Info } from "lucide-react";

interface ClientWorkoutsProps {
  user: User;
  allWorkouts: WorkoutLog[];
  onToggleWorkout: (
    week: number,
    workoutName: WorkoutName,
    caloriesBurned?: number
  ) => Promise<string | null>;
}

// The client's own workout screen: check workouts off.
export default function ClientWorkouts({ user, allWorkouts, onToggleWorkout }: ClientWorkoutsProps) {
  const programStatus = getProgramStatus(user);
  const currentWeekNum = getCurrentWeekNum(user);
  const [viewWeek, setViewWeek] = useState(currentWeekNum);

  if (programStatus === "not_started") {
    return (
      <NotStartedNotice
        title="Workout Tracking"
        startDate={user.program_start_date}
        message="Your program starts on"
      />
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" id="workout-tracking-screen">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Workout Tracking</h1>
        <p className="text-sm text-gray-500 mt-1">
          {programStatus === "completed"
            ? "All 12 weeks done — great work! You can still fix any week's check-offs."
            : "Check off each workout when you finish it and log the calories you burned — they count toward your weekly deficit."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <WorkoutList
          user={user}
          allWorkouts={allWorkouts}
          viewWeek={viewWeek}
          currentWeekNum={currentWeekNum}
          isCurrentActiveWeek={viewWeek === currentWeekNum && programStatus === "active"}
          onChangeWeek={(delta) => setViewWeek((w) => Math.min(currentWeekNum, Math.max(1, w + delta)))}
          onToggle={(name, calories) => onToggleWorkout(viewWeek, name, calories)}
        />
        <WorkoutProgressCard
          user={user}
          allWorkouts={allWorkouts}
          footer={
            <>
              <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <span>
                Made a mistake? Tap a checked workout to uncheck it — its calories are removed from that
                week automatically.
              </span>
            </>
          }
        />
      </div>
    </div>
  );
}
