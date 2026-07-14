// Smoke check for the flexible-workout math: run with `npx tsx scripts/selfcheck.ts`
import assert from "node:assert";
import { calculateUserStats, presetBurn, WEEKLY_GOAL, WORKOUT_SETS } from "../src/data";
import { User, WorkoutLog } from "../src/types";

const user: User = {
  id: "u1",
  email: "t@t.t",
  name: "Test",
  age: 30,
  gender: "Male",
  height: 175,
  starting_weight: 80,
  target_weight: 72,
  bmr: 1700,
  program_start_date: "2026-07-13", // Monday of the current week
  status: "active"
};

const workouts: WorkoutLog[] = [
  { id: "1", user_id: "u1", week: 1, workout_name: "Lower Body", calories_burned: 250, completed: true, completed_at: "2026-07-13" },
  { id: "2", user_id: "u1", week: 1, workout_name: "Lower Body (3-Day)", calories_burned: 250, completed: true, completed_at: "2026-07-14" },
  { id: "3", user_id: "u1", week: 1, workout_name: "Personal", calories_burned: 500, completed: true, completed_at: "2026-07-14", notes: "5km run" }
];

const stats = calculateUserStats(user, [], workouts);

// Personal is kcal, not a session; both Lower Body sets count separately
assert.equal(stats.workoutCompletionCount, 2, "Personal must not count as a session");
assert.equal(stats.totalWorkouts, 12 * WEEKLY_GOAL, "program total = 12 weeks x soft goal");
// ...but its burn joins the weekly deficit
assert.equal(stats.weeklySummaries[0].calories_burned, 1000, "Personal burn must join the deficit");

// MET 3.5 preset reproduces the old hand-computed values (~1 kcal/kg/h resting)
assert.equal(presetBurn(1700), 248);
assert.equal(presetBurn(24 * 60), 210); // 60 kg-equivalent BMR -> old "Lower Body" preset

// Five distinct coach sets, unique names
assert.equal(WORKOUT_SETS.length, 5);
assert.equal(new Set(WORKOUT_SETS.map((s) => s.name)).size, 5);

console.log("selfcheck OK");
