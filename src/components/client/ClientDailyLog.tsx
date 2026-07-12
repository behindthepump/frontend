import { useState } from "react";
import { User, DailyCalorie, WorkoutLog } from "../../types";
import {
  getProgramStatus,
  getCurrentWeekNum,
  getProgramWeekDates,
  todayStr as getTodayStr,
  PROGRAM_WEEKS
} from "../../data";
import CalorieCalendar from "../tracker/CalorieCalendar";
import CalorieLogForm from "../tracker/CalorieLogForm";
import WeeklyDeficitSummary from "../tracker/WeeklyDeficitSummary";
import FoodReference from "../tracker/FoodReference";
import NotStartedNotice from "../tracker/NotStartedNotice";

interface ClientDailyLogProps {
  user: User;
  allCalories: DailyCalorie[];
  allWorkouts: WorkoutLog[];
  onSaveCalories: (date: string, calories: number, notes: string) => Promise<string | null>;
}

// The client's own daily screen: browse the week, log/edit a day.
export default function ClientDailyLog({ user, allCalories, allWorkouts, onSaveCalories }: ClientDailyLogProps) {
  const programStatus = getProgramStatus(user);
  const currentWeekNum = getCurrentWeekNum(user);
  const todayStr = getTodayStr();

  const [viewWeek, setViewWeek] = useState(currentWeekNum);
  const lastProgramDay = getProgramWeekDates(user, PROGRAM_WEEKS)[6].date;
  const [selectedDate, setSelectedDate] = useState(
    programStatus === "completed" ? lastProgramDay : todayStr
  );
  // Bumped by the food reference's + buttons; the log form adds the amount
  // to its calories input.
  const [foodAdd, setFoodAdd] = useState<{ amount: number; seq: number } | null>(null);

  if (programStatus === "not_started") {
    return (
      <NotStartedNotice
        title="Daily Calorie Log"
        startDate={user.program_start_date}
        message="Your program starts on"
      />
    );
  }

  const changeWeek = (delta: number) => {
    const week = Math.min(currentWeekNum, Math.max(1, viewWeek + delta));
    if (week === viewWeek) return;
    setViewWeek(week);
    const dates = getProgramWeekDates(user, week);
    const todayInWeek = dates.some((d) => d.date === todayStr);
    setSelectedDate(todayInWeek ? todayStr : dates[0].date);
  };

  const existing = allCalories.find((c) => c.user_id === user.id && c.date === selectedDate);

  return (
    <div className="space-y-6 animate-fadeIn" id="daily-tracking-screen">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Daily Calorie Log</h1>
        <p className="text-sm text-gray-500 mt-1">
          {programStatus === "completed"
            ? "You made it through all 12 weeks! You can still review your logged days and fill any you missed."
            : "Log what you ate — it takes ten seconds. Skipped days count as zero, so every log protects your progress."}
        </p>
      </div>

      <CalorieCalendar
        user={user}
        allCalories={allCalories}
        viewWeek={viewWeek}
        currentWeekNum={currentWeekNum}
        onChangeWeek={changeWeek}
        selectedDate={selectedDate}
        onSelectDay={setSelectedDate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" id="form-stats-grid">
        <CalorieLogForm
          user={user}
          selectedDate={selectedDate}
          existing={existing}
          foodAdd={foodAdd}
          onSave={(calories, notes) => onSaveCalories(selectedDate, calories, notes)}
        />
        <WeeklyDeficitSummary
          user={user}
          allCalories={allCalories}
          allWorkouts={allWorkouts}
          viewWeek={viewWeek}
        />
      </div>

      <FoodReference
        onAddFood={(calories) =>
          setFoodAdd((prev) => ({ amount: calories, seq: (prev?.seq ?? 0) + 1 }))
        }
      />
    </div>
  );
}
