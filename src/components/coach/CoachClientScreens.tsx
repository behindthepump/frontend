import React from "react";
import { User, DailyCalorie, WorkoutLog } from "../../types";
import { ClipboardList, User as UserIcon } from "lucide-react";
import Profile from "../Profile";
import CoachClientReport from "./CoachClientReport";

// The coach's drill-in is its own lens - a monitoring report, not the
// client's tracker screens. Two tabs: the report, and the editable profile.
export const COACH_CLIENT_TABS = [
  { id: "report", label: "Client Report", shortLabel: "Report", Icon: ClipboardList },
  { id: "profile", label: "Profile", shortLabel: "Profile", Icon: UserIcon }
];

interface CoachClientScreensProps {
  user: User;
  allCalories: DailyCalorie[];
  allWorkouts: WorkoutLog[];
  activeTab: string;
  onUpdateUser: (updatedUser: User) => Promise<string | null>;
}

export default function CoachClientScreens({
  user,
  allCalories,
  allWorkouts,
  activeTab,
  onUpdateUser
}: CoachClientScreensProps) {
  if (activeTab === "profile") {
    return <Profile user={user} canEdit={true} onUpdateUser={onUpdateUser} />;
  }
  return <CoachClientReport user={user} allCalories={allCalories} allWorkouts={allWorkouts} />;
}
