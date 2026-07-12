import { User, DailyCalorie, WorkoutLog, WorkoutName } from "../../types";
import { calculateUserStats, getProgramStatus } from "../../data";
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
    case "profile":
      return <Profile user={user} canEdit={false} />;
    case "dashboard":
    default:
      return (
        <Dashboard
          user={user}
          calculations={stats}
          allCalories={allCalories}
          subtitle="Your 12-week plan — one day at a time"
          cta={<ClientCtaCard user={user} programStatus={getProgramStatus(user)} onNavigate={onNavigate} />}
          onNavigate={onNavigate}
        />
      );
  }
}
