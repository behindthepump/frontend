export interface User {
  id: string; // Firebase uid
  email: string;
  name: string;
  age: number;
  gender: string;
  starting_weight: number; // in KG
  target_weight: number; // in KG
  bmr: number; // kcal
  program_start_date: string; // YYYY-MM-DD, Monday of Week 1
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
  workout_name: "Lower Body" | "Upper Body Push" | "Upper Body Pull";
  calories_burned: number;
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
