// 2-day split uses Lower/Upper; 3-day uses Lower/Push/Pull (see data.ts).
export type WorkoutName = "Lower Body" | "Upper Body" | "Upper Body Push" | "Upper Body Pull";

// Lifecycle of a self-signed-up client: pending until the coach approves.
export type UserStatus = "pending" | "active" | "declined";

export interface User {
  id: string; // Firebase uid
  email: string;
  name: string;
  age: number;
  gender: string;
  height: number; // cm, client-entered at onboarding (drives BMR)
  starting_weight: number; // in KG
  target_weight: number; // in KG
  bmr: number; // kcal
  program_start_date: string; // YYYY-MM-DD, Monday of Week 1 (set at approval)
  workout_frequency: 2 | 3; // coach-set workouts per week (set at approval)
  status: UserStatus;
  requested_at?: string; // ISO timestamp of the signup request
}

export interface DailyCalorie {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  calories: number;
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  week: number; // 1 to 12
  workout_name: WorkoutName;
  calories_burned: number; // entered by the client at check-off
  completed: boolean;
  completed_at: string | null; // YYYY-MM-DD or null
}

export interface WeeklySummary {
  user_id: string;
  week: number;
  deficit: number;
  calories_burned: number;
  weight_lost: number; // Estimated weight loss in KG for this week
}
