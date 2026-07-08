import React from "react";
import { User, DailyCalorie, WorkoutLog } from "../../types";
import { calculateUserStats, getProgramStatus } from "../../data";
import Dashboard from "../Dashboard";
import Progress from "../Progress";
import Profile from "../Profile";
import CoachCtaCard from "./CoachCtaCard";
import CoachDailyView from "./CoachDailyView";
import CoachWorkoutsView from "./CoachWorkoutsView";

interface CoachClientScreensProps {
  user: User;
  allCalories: DailyCalorie[];
  allWorkouts: WorkoutLog[];
  activeTab: string;
  onNavigate: (tab: string) => void;
  onUpdateUser: (updatedUser: User) => Promise<string | null>;
}

// The coach's read-only screens for one client. No log/toggle handlers exist
// here at all — monitoring only. The coach can still edit the profile.
export default function CoachClientScreens({
  user,
  allCalories,
  allWorkouts,
  activeTab,
  onNavigate,
  onUpdateUser
}: CoachClientScreensProps) {
  const stats = calculateUserStats(user, allCalories, allWorkouts);

  switch (activeTab) {
    case "daily":
      return <CoachDailyView user={user} allCalories={allCalories} allWorkouts={allWorkouts} />;
    case "workout":
      return <CoachWorkoutsView user={user} allWorkouts={allWorkouts} />;
    case "progress":
      return <Progress user={user} calculations={stats} />;
    case "profile":
      return <Profile user={user} canEdit={true} onUpdateUser={onUpdateUser} />;
    case "dashboard":
    default:
      return (
        <Dashboard
          user={user}
          calculations={stats}
          allCalories={allCalories}
          subtitle={`${user.name}'s 12-week plan`}
          cta={<CoachCtaCard user={user} programStatus={getProgramStatus(user)} onNavigate={onNavigate} />}
          onNavigate={onNavigate}
        />
      );
  }
}
