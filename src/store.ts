import { apiDelete, apiGet, apiPost, apiPut } from "./api/client";
import { Session } from "./auth";
import { User, DailyCalorie, WorkoutLog } from "./types";

// Data layer: everything goes through the backend REST API. The backend
// owns Firestore; the browser never touches it directly.

export interface AppData {
  users: User[];
  dailyCalories: DailyCalorie[];
  workoutLogs: WorkoutLog[];
}

function workoutKey(week: number, workoutName: string): string {
  return `w${week}_${workoutName.toLowerCase().replace(/\s+/g, "-")}`;
}

// One bootstrap load per sign-in. The server shapes the response by the
// caller's role (coach: everyone; client: own), so the session arg is only
// here for call-site symmetry.
export async function loadAppData(_session: Pick<Session, "userId" | "role">): Promise<AppData> {
  return apiGet<AppData>("/v1/app-data");
}

export async function saveCaloriesEntry(
  uid: string,
  date: string,
  calories: number,
  notes: string
): Promise<void> {
  await apiPut(`/v1/clients/${uid}/calories/${date}`, { calories, notes });
}

export async function saveWorkoutLog(uid: string, log: WorkoutLog): Promise<void> {
  await apiPut(`/v1/clients/${uid}/workouts/${workoutKey(log.week, log.workout_name)}`, {
    week: log.week,
    workout_name: log.workout_name,
    calories_burned: log.calories_burned,
    completed: log.completed,
    completed_at: log.completed_at
  });
}

export async function saveProfile(user: User): Promise<void> {
  await apiPut(`/v1/clients/${user.id}/profile`, {
    name: user.name,
    age: user.age,
    gender: user.gender,
    starting_weight: user.starting_weight,
    target_weight: user.target_weight,
    bmr: user.bmr
  });
}

export interface NewClientResult {
  user: User;
  workoutLogs: WorkoutLog[];
  tempPassword: string;
}

// Onboard a client. The backend creates the Auth account (Admin SDK), the
// user doc, and the 12-week plan, and returns the one-time temp password.
export async function createClient(fields: Omit<User, "id">): Promise<NewClientResult> {
  return apiPost<NewClientResult>("/v1/clients", fields);
}

// Remove a client entirely: the backend deletes the Auth account AND all
// Firestore data (no orphaned sign-in accounts).
export async function deleteClientData(uid: string): Promise<void> {
  await apiDelete(`/v1/clients/${uid}`);
}
