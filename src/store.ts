import { apiDelete, apiGet, apiPost, apiPut } from "./api/client";
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

// The signed-in client's own bootstrap load (the coach's roster is served
// paginated by fetchClientsPage instead). The server shapes it by the token.
export async function loadAppData(): Promise<AppData> {
  return apiGet<AppData>("/v1/app-data");
}

// --- Coach roster (server-side search + cursor pagination + stats) ---

export interface ClientStats {
  program_status: "not_started" | "active" | "completed";
  current_week: number;
  total_weight_lost: number;
  last_logged: string | null;
  week_workouts_completed: number;
  week_days_logged: number;
}

export interface ClientSummary {
  user: User;
  stats: ClientStats;
}

export interface ClientPage {
  clients: ClientSummary[];
  nextCursor: string | null;
}

export async function fetchClientsPage(search: string, cursor: string | null): Promise<ClientPage> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (cursor) params.set("cursor", cursor);
  const qs = params.toString();
  return apiGet<ClientPage>(`/v1/clients${qs ? `?${qs}` : ""}`);
}

// Signup requests (pending + declined), oldest first.
export async function fetchRequests(): Promise<User[]> {
  return apiGet<User[]>("/v1/clients/requests");
}

// Drill-in: one client's profile + full logs.
export interface ClientData {
  user: User;
  dailyCalories: DailyCalorie[];
  workoutLogs: WorkoutLog[];
}

export async function fetchClientData(uid: string): Promise<ClientData> {
  return apiGet<ClientData>(`/v1/clients/${uid}/data`);
}

// Self-signup onboarding: creates the caller's pending user doc. The backend
// computes BMR and the coach approves from the requests table.
export interface OnboardingFields {
  name: string;
  age: number;
  gender: string;
  height: number;
  starting_weight: number;
  target_weight: number;
}

export async function submitOnboarding(fields: OnboardingFields): Promise<void> {
  await apiPost("/v1/me/onboarding", fields);
}

// Coach accepts a request. The backend anchors the start date to its Monday
// and returns the final values to mirror into local state.
export async function approveClient(
  uid: string,
  programStartDate: string,
  workoutFrequency: 2 | 3
): Promise<{ program_start_date: string; workout_frequency: 2 | 3 }> {
  return apiPost(`/v1/clients/${uid}/approve`, {
    program_start_date: programStartDate,
    workout_frequency: workoutFrequency
  });
}

export async function declineClient(uid: string): Promise<void> {
  await apiPost(`/v1/clients/${uid}/decline`);
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
    height: user.height,
    starting_weight: user.starting_weight,
    target_weight: user.target_weight,
    bmr: user.bmr,
    workout_frequency: user.workout_frequency
  });
}

// Remove a client entirely: the backend deletes the Auth account AND all
// Firestore data. The person can sign up again with Google if they return.
export async function deleteClientData(uid: string): Promise<void> {
  await apiDelete(`/v1/clients/${uid}`);
}
