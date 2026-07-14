import { useState } from "react";
import { User, DailyCalorie, WorkoutLog, WorkoutName } from "../types";
import { Session } from "../auth";
import AppShell from "../components/AppShell";
import { TrackerNav, TrackerBottomNav } from "../components/tracker/TrackerNav";
import ClientTrackerScreens from "../components/client/ClientTrackerScreens";
import { Dumbbell } from "lucide-react";

interface ClientViewProps {
  session: Session;
  users: User[];
  allCalories: DailyCalorie[];
  allWorkouts: WorkoutLog[];
  onLogout: () => void;
  onSaveCalories: (
    clientId: string,
    date: string,
    calories: number,
    notes: string
  ) => Promise<string | null>;
  onToggleWorkout: (
    clientId: string,
    week: number,
    workoutName: WorkoutName,
    caloriesBurned?: number,
    notes?: string
  ) => Promise<string | null>;
}

// The signed-in client's view: their own tracker, nothing else.
export default function ClientView({
  session,
  users,
  allCalories,
  allWorkouts,
  onLogout,
  onSaveCalories,
  onToggleWorkout,
}: ClientViewProps) {
  const [activeTab, setActiveTab] = useState("dashboard");

  const client = users.find((u) => u.id === session.userId) || null;

  // A client whose account was deleted has no data to show
  if (!client) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <Dumbbell className="w-10 h-10 text-[#2ECC71] mx-auto" />
          <p className="text-sm font-bold text-gray-600">
            Your account isn't active right now. Check with your coach — they can get you set up again.
          </p>
          <button
            onClick={onLogout}
            className="bg-[#111111] text-white text-xs font-bold px-5 py-2.5 rounded-xl uppercase tracking-wider cursor-pointer"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      session={session}
      onLogout={onLogout}
      sidebarNav={<TrackerNav activeTab={activeTab} onSelect={setActiveTab} />}
      bottomNav={<TrackerBottomNav activeTab={activeTab} onSelect={setActiveTab} />}
    >
      <ClientTrackerScreens
        user={client}
        allCalories={allCalories}
        allWorkouts={allWorkouts}
        activeTab={activeTab}
        onNavigate={setActiveTab}
        onSaveCalories={onSaveCalories}
        onToggleWorkout={onToggleWorkout}
      />
    </AppShell>
  );
}
