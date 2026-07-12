import { User, DailyCalorie, WorkoutLog, WorkoutName } from "../../types";
import { calculateUserStats, getProgramStatus, todayStr } from "../../data";
import Dashboard from "../Dashboard";
import Progress from "../Progress";
import Profile from "../Profile";
import ClientCtaCard from "./ClientCtaCard";
import ClientDailyLog from "./ClientDailyLog";
import ClientWorkouts from "./ClientWorkouts";

interface ClientTrackerScreensProps {
  user: User;
  allCalories: DailyCalorie[];
  allWorkouts: WorkoutLog[];
  activeTab: string;
  onNavigate: (tab: string) => void;
  onSaveCalories: (clientId: string, date: string, calories: number, notes: string) => Promise<string | null>;
  onToggleWorkout: (
    clientId: string,
    week: number,
    workoutName: WorkoutName,
    caloriesBurned?: number
  ) => Promise<string | null>;
}

// The signed-in client's own screens: interactive logging.
export default function ClientTrackerScreens({
  user,
  allCalories,
  allWorkouts,
  activeTab,
  onNavigate,
  onSaveCalories,
  onToggleWorkout
}: ClientTrackerScreensProps) {
  const stats = calculateUserStats(user, allCalories, allWorkouts);

  switch (activeTab) {
    case "daily":
      return (
        <ClientDailyLog
          user={user}
          allCalories={allCalories}
          allWorkouts={allWorkouts}
          onSaveCalories={(date, calories, notes) => onSaveCalories(user.id, date, calories, notes)}
        />
      );
    case "workout":
      return (
        <ClientWorkouts
          user={user}
          allWorkouts={allWorkouts}
          onToggleWorkout={(week, name, calories) => onToggleWorkout(user.id, week, name, calories)}
        />
      );
    case "progress":
      return <Progress user={user} calculations={stats} />;
    case "profile": {
      const goalKg = user.starting_weight - user.target_weight;
      return (
        <Profile
          user={user}
          canEdit={false}
          goalProgress={goalKg > 0 ? Math.min(1, stats.totalWeightLost / goalKg) : 0}
        />
      );
    }
    case "dashboard":
    default: {
      const weekWorkoutsDone = allWorkouts.filter(
        (w) => w.user_id === user.id && w.week === stats.currentWeekNum && w.completed
      ).length;
      const loggedToday = allCalories.some((c) => c.user_id === user.id && c.date === todayStr());
      return (
        <Dashboard
          user={user}
          calculations={stats}
          allCalories={allCalories}
          allWorkouts={allWorkouts}
          subtitle="Your 12-week plan — one day at a time"
          cta={
            <ClientCtaCard
              user={user}
              programStatus={getProgramStatus(user)}
              weekWorkoutsDone={weekWorkoutsDone}
              loggedToday={loggedToday}
              onNavigate={onNavigate}
            />
          }
          onNavigate={onNavigate}
        />
      );
    }
  }
}
