import { User, DailyCalorie, WorkoutLog, WeeklySummary, WorkoutName } from "./types";

// Workout slots per coach-set weekly frequency. Burn calories are entered
// by the client at check-off, not fixed here.
export const WORKOUT_SLOTS: Record<2 | 3, WorkoutName[]> = {
  2: ["Lower Body", "Upper Body"],
  3: ["Lower Body", "Upper Body Push", "Upper Body Pull"]
};

// Sanity cap on a self-reported workout burn (mirrors the backend).
export const MAX_WORKOUT_CALORIES = 3000;

export const PROGRAM_WEEKS = 12;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Parse YYYY-MM-DD as a local date (avoids UTC shift from new Date("YYYY-MM-DD"))
function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Format Date safely as YYYY-MM-DD
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// The real current date as YYYY-MM-DD
export function todayStr(): string {
  return formatDate(new Date());
}

// "2026-07-04" -> "Jul 4" (for compact badges)
export function formatShortDate(dateStr: string): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [, m, d] = dateStr.split("-").map(Number);
  return `${months[(m ?? 1) - 1]} ${d}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

// Monday of the week containing the given date
export function mondayOf(dateStr: string): string {
  const d = parseDate(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  return formatDate(d);
}

// Raw program week for a date relative to a start date.
// Can be < 1 (before the program) or > 12 (after it ends).
export function getWeekForDate(dateStr: string, startDateStr: string): number {
  // Round (not floor) the day count: local-midnight diffs across a DST
  // change are ±1h off a whole number of days.
  const diffDays = Math.round(
    (parseDate(dateStr).getTime() - parseDate(startDateStr).getTime()) / MS_PER_DAY
  );
  return Math.floor(diffDays / 7) + 1;
}

// The user's current program week, clamped to 1..12
export function getCurrentWeekNum(user: User): number {
  const raw = getWeekForDate(todayStr(), user.program_start_date);
  return Math.max(1, Math.min(PROGRAM_WEEKS, raw));
}

export type ProgramStatus = "not_started" | "active" | "completed";

// Where the user is in their program today
export function getProgramStatus(user: User): ProgramStatus {
  const raw = getWeekForDate(todayStr(), user.program_start_date);
  if (raw < 1) return "not_started";
  if (raw > PROGRAM_WEEKS) return "completed";
  return "active";
}

// The 7 dates (Mon-Sun) of a given program week for a user
export function getProgramWeekDates(
  user: User,
  week: number
): { date: string; label: string }[] {
  const daysShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekStart = addDays(user.program_start_date, (week - 1) * 7);
  return daysShort.map((label, i) => ({
    date: addDays(weekStart, i),
    label
  }));
}

// Sanity limits for client metrics (onboarding + coach profile edits).
// Returns an error message, or null if the values are usable. bmr is
// optional because onboarding computes it server-side.
export function clientMetricsError(fields: {
  age: number;
  height: number;
  starting_weight: number;
  target_weight: number;
  bmr?: number;
}): string | null {
  const { age, height, starting_weight, target_weight, bmr } = fields;
  if (!Number.isFinite(age) || age < 1 || age > 120) return "Age must be between 1 and 120.";
  if (!Number.isFinite(height) || height < 50 || height > 250) return "Height must be between 50 and 250 cm.";
  if (!Number.isFinite(starting_weight) || starting_weight <= 0) return "Starting weight must be greater than 0.";
  if (!Number.isFinite(target_weight) || target_weight <= 0) return "Target weight must be greater than 0.";
  if (target_weight >= starting_weight) return "Target weight must be below starting weight.";
  if (bmr !== undefined && (!Number.isFinite(bmr) || bmr <= 0)) return "BMR must be greater than 0.";
  return null;
}

// Calculate the full analytical summaries for a user
export interface UserCalculations {
  currentWeight: number;
  totalCalorieDeficit: number;
  totalWeightLost: number;
  workoutCompletionCount: number;
  totalWorkouts: number;
  currentWeekNum: number;
  programStatus: ProgramStatus;
  missedLoggingDays: number; // elapsed program days with no calorie log
  lastLoggedDate: string | null; // most recent calorie log or workout check-off
  weeklySummaries: WeeklySummary[];
  overallProgressPercent: number;
}

export function calculateUserStats(
  user: User,
  allCalories: DailyCalorie[],
  allWorkouts: WorkoutLog[]
): UserCalculations {
  const userCalories = allCalories.filter((c) => c.user_id === user.id);
  const userWorkouts = allWorkouts.filter((w) => w.user_id === user.id);

  const currentWeekNum = getCurrentWeekNum(user);
  const programStatus = getProgramStatus(user);

  const totalWorkouts = PROGRAM_WEEKS * user.workout_frequency; // 24 or 36
  const workoutCompletionCount = userWorkouts.filter((w) => w.completed).length;

  // The client's most recent activity: latest calorie-log date or
  // workout check-off date. Null when they have never logged anything.
  const activityDates = [
    ...userCalories.map((c) => c.date),
    ...userWorkouts.filter((w) => w.completed && w.completed_at).map((w) => w.completed_at as string)
  ];
  const lastLoggedDate = activityDates.length > 0 ? activityDates.sort().pop()! : null;

  // Logging gaps (R17): program days before today with no calorie entry.
  // Today doesn't count as missed - it can still be logged.
  let missedLoggingDays = 0;
  if (programStatus !== "not_started") {
    const today = todayStr();
    const lastProgramDay = addDays(user.program_start_date, PROGRAM_WEEKS * 7 - 1);
    const loggedDates = new Set(userCalories.map((c) => c.date));
    for (
      let d = user.program_start_date;
      d < today && d <= lastProgramDay;
      d = addDays(d, 1)
    ) {
      if (!loggedDates.has(d)) missedLoggingDays++;
    }
  }

  const weeklySummaries: WeeklySummary[] = [];

  for (let w = 1; w <= PROGRAM_WEEKS; w++) {
    const datesInWeek = getProgramWeekDates(user, w).map((d) => d.date);

    // Daily deficit = BMR - calories eaten, for logged days only.
    // Unlogged days contribute zero.
    let dailyDeficitsSum = 0;
    datesInWeek.forEach((date) => {
      const log = userCalories.find((c) => c.date === date);
      if (log) {
        dailyDeficitsSum += user.bmr - log.calories;
      }
    });

    const weeklyWorkouts = userWorkouts.filter((wk) => wk.week === w && wk.completed);
    const caloriesBurned = weeklyWorkouts.reduce((sum, item) => sum + item.calories_burned, 0);

    // Weekly Deficit = Sum(Daily Deficits) + Workout Calories Burned
    const deficit = dailyDeficitsSum + caloriesBurned;

    // Estimated Weight Loss = Weekly Deficit / 7700 (never negative)
    const weightLost = deficit > 0 ? parseFloat((deficit / 7700).toFixed(2)) : 0;

    weeklySummaries.push({
      user_id: user.id,
      week: w,
      deficit: Math.round(deficit),
      calories_burned: Math.round(caloriesBurned),
      weight_lost: weightLost
    });
  }

  const overallProgressPercent =
    programStatus === "not_started" ? 0 : Math.round((currentWeekNum / PROGRAM_WEEKS) * 100);

  // Totals accumulate from Week 1 up to the current week
  let totalCalorieDeficit = 0;
  let totalWeightLost = 0;

  weeklySummaries.forEach((summary) => {
    if (summary.week <= currentWeekNum) {
      totalCalorieDeficit += summary.deficit;
      totalWeightLost += summary.weight_lost;
    }
  });

  const currentWeight = parseFloat((user.starting_weight - totalWeightLost).toFixed(2));

  return {
    currentWeight,
    totalCalorieDeficit,
    totalWeightLost: parseFloat(totalWeightLost.toFixed(2)),
    workoutCompletionCount,
    totalWorkouts,
    currentWeekNum,
    programStatus,
    missedLoggingDays,
    lastLoggedDate,
    weeklySummaries,
    overallProgressPercent
  };
}
