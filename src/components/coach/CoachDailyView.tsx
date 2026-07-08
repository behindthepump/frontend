import React, { useState } from "react";
import { User, DailyCalorie, WorkoutLog } from "../../types";
import { getProgramStatus, getCurrentWeekNum } from "../../data";
import CalorieCalendar from "../tracker/CalorieCalendar";
import WeeklyDeficitSummary from "../tracker/WeeklyDeficitSummary";
import NotStartedNotice from "../tracker/NotStartedNotice";

interface CoachDailyViewProps {
  user: User;
  allCalories: DailyCalorie[];
  allWorkouts: WorkoutLog[];
}

// The coach's read-only view of a client's daily log: calendar + summary, no form.
export default function CoachDailyView({ user, allCalories, allWorkouts }: CoachDailyViewProps) {
  const programStatus = getProgramStatus(user);
  const currentWeekNum = getCurrentWeekNum(user);
  const [viewWeek, setViewWeek] = useState(currentWeekNum);

  if (programStatus === "not_started") {
    return (
      <NotStartedNotice
        title="Daily Calorie Log"
        startDate={user.program_start_date}
        message={`${user.name}'s program starts on`}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" id="daily-tracking-screen">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Daily Calorie Log</h1>
        <p className="text-sm text-gray-500 mt-1">A read-only view of {user.name}'s daily calorie log.</p>
      </div>

      <CalorieCalendar
        user={user}
        allCalories={allCalories}
        viewWeek={viewWeek}
        currentWeekNum={currentWeekNum}
        onChangeWeek={(delta) => setViewWeek((w) => Math.min(currentWeekNum, Math.max(1, w + delta)))}
      />

      <WeeklyDeficitSummary
        user={user}
        allCalories={allCalories}
        allWorkouts={allWorkouts}
        viewWeek={viewWeek}
      />
    </div>
  );
}
