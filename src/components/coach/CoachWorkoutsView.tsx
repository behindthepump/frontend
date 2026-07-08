import React, { useState } from "react";
import { User, WorkoutLog } from "../../types";
import { getProgramStatus, getCurrentWeekNum } from "../../data";
import WorkoutList from "../tracker/WorkoutList";
import WorkoutProgressCard from "../tracker/WorkoutProgressCard";
import NotStartedNotice from "../tracker/NotStartedNotice";
import { Info } from "lucide-react";

interface CoachWorkoutsViewProps {
  user: User;
  allWorkouts: WorkoutLog[];
}

// The coach's read-only view of a client's workout check-offs.
export default function CoachWorkoutsView({ user, allWorkouts }: CoachWorkoutsViewProps) {
  const programStatus = getProgramStatus(user);
  const currentWeekNum = getCurrentWeekNum(user);
  const [viewWeek, setViewWeek] = useState(currentWeekNum);

  if (programStatus === "not_started") {
    return (
      <NotStartedNotice
        title="Workout Tracking"
        startDate={user.program_start_date}
        message={`${user.name}'s program starts on`}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" id="workout-tracking-screen">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Workout Tracking</h1>
        <p className="text-sm text-gray-500 mt-1">A read-only view of {user.name}'s workout check-offs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <WorkoutList
          user={user}
          allWorkouts={allWorkouts}
          viewWeek={viewWeek}
          currentWeekNum={currentWeekNum}
          isCurrentActiveWeek={viewWeek === currentWeekNum && programStatus === "active"}
          onChangeWeek={(delta) => setViewWeek((w) => Math.min(currentWeekNum, Math.max(1, w + delta)))}
        />
        <WorkoutProgressCard
          user={user}
          allWorkouts={allWorkouts}
          footer={
            <>
              <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <span>{user.name} checks these off as they train — this view is read-only.</span>
            </>
          }
        />
      </div>
    </div>
  );
}
