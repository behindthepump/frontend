import React, { useState } from "react";
import { User, WorkoutLog, WorkoutName } from "../../types";
import { WORKOUT_PLANS, MAX_WORKOUT_CALORIES, presetBurn, formatShortDate, WEEKLY_GOAL } from "../../data";
import { ROUTINES, RoutineLocation } from "../../routines";
import Expand from "../Expand";
import {
  CheckSquare,
  Square,
  Flame,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Save,
  NotebookPen,
  StickyNote
} from "lucide-react";

interface WorkoutListProps {
  user: User;
  allWorkouts: WorkoutLog[];
  viewWeek: number;
  currentWeekNum: number;
  isCurrentActiveWeek: boolean;
  onChangeWeek: (delta: number) => void;
  // Passing onToggle makes rows tappable (client). Omit for read-only (coach).
  // With caloriesBurned: mark done (or update) with that burn; without: uncheck.
  onToggle?: (workoutName: WorkoutName, caloriesBurned?: number, notes?: string) => Promise<string | null>;
}

export default function WorkoutList({
  user,
  allWorkouts,
  viewWeek,
  currentWeekNum,
  isCurrentActiveWeek,
  onChangeWeek,
  onToggle
}: WorkoutListProps) {
  const [togglingName, setTogglingName] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState("");
  // Slot awaiting the client's calories-burned entry before completing
  const [pendingName, setPendingName] = useState<WorkoutName | null>(null);
  const [caloriesInput, setCaloriesInput] = useState("");
  // The free-form "Personal" weekly entry has its own notes field
  const [notesInput, setNotesInput] = useState("");
  // Which routine variant to display (display-only, never persisted)
  const [location, setLocation] = useState<RoutineLocation>("gym");
  const [openRoutine, setOpenRoutine] = useState<WorkoutName | null>(null);

  const viewWeekWorkouts = allWorkouts.filter((w) => w.user_id === user.id && w.week === viewWeek);
  const getWorkoutLog = (name: string) => viewWeekWorkouts.find((w) => w.workout_name === name);
  const personal = getWorkoutLog("Personal");

  const resetEntry = () => {
    setPendingName(null);
    setCaloriesInput("");
    setNotesInput("");
  };

  // Prefill the burn: their previous entry for this slot if any, else the
  // BMR-based estimate for a ~1h session. Always editable before saving.
  // "Personal" gets no estimate - that total is the client's own math.
  const openEntry = (name: WorkoutName) => {
    const prev = getWorkoutLog(name)?.calories_burned ?? 0;
    const preset = prev > 0 ? prev : name !== "Personal" && user.bmr > 0 ? presetBurn(user.bmr) : "";
    setPendingName(name);
    setCaloriesInput(String(preset));
    setNotesInput(name === "Personal" ? getWorkoutLog(name)?.notes ?? "" : "");
  };

  const uncheck = (name: WorkoutName, confirmText: string) => {
    if (!window.confirm(confirmText)) return;
    setTogglingName(name);
    void onToggle?.(name).then((error) => {
      setTogglingName(null);
      if (error) setToggleError(error);
    });
  };

  const handleRowClick = (name: WorkoutName, isCompleted: boolean) => {
    if (!onToggle || togglingName) return;
    setToggleError("");
    if (isCompleted) {
      const burn = getWorkoutLog(name)?.calories_burned ?? 0;
      uncheck(name, `Uncheck ${name}? Its +${burn} kcal comes off this week.`);
      return;
    }
    // Completing needs the burn first - open the inline entry.
    openEntry(name);
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onToggle || !pendingName) return;
    const calories = Number(caloriesInput);
    if (caloriesInput === "" || !Number.isFinite(calories) || calories < 0 || calories > MAX_WORKOUT_CALORIES) {
      setToggleError(`Calories burned must be between 0 and ${MAX_WORKOUT_CALORIES}.`);
      return;
    }
    setToggleError("");
    setTogglingName(pendingName);
    const error = await onToggle(pendingName, calories, notesInput);
    setTogglingName(null);
    if (error) {
      setToggleError(error);
      return;
    }
    resetEntry();
  };

  // The inline kcal entry form, shared by every set and the personal entry
  const entryForm = (withNotes: boolean, isPending: boolean) => (
    <form
      onSubmit={handleCompleteSubmit}
      className="mx-2 p-4 bg-gray-50 border border-t-0 border-gray-200 rounded-b-2xl space-y-2"
    >
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            // Focus when this slot's entry opens (autoFocus can't -
            // the collapsed form stays mounted)
            ref={isPending ? (el) => el?.focus() : undefined}
            placeholder="Calories burned, e.g. 250"
            value={caloriesInput}
            onChange={(e) => setCaloriesInput(e.target.value)}
            min="0"
            max={MAX_WORKOUT_CALORIES}
            className="w-full bg-white border border-gray-200 focus:border-[#2ECC71] text-gray-900 font-bold font-mono text-sm py-2.5 pl-3 pr-12 rounded-xl transition outline-none"
            required
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">
            kcal
          </span>
        </div>
        <button
          type="submit"
          className="bg-[#111111] hover:bg-[#2ECC71] hover:text-[#111111] text-white text-xs font-bold px-4 py-2.5 rounded-xl uppercase tracking-wider transition hover:scale-[1.03] active:scale-[0.97] flex items-center space-x-1.5 cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Done</span>
        </button>
        <button
          type="button"
          onClick={resetEntry}
          className="bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 text-xs font-bold px-4 py-2.5 rounded-xl uppercase tracking-wider transition cursor-pointer"
        >
          Cancel
        </button>
      </div>
      {withNotes ? (
        <textarea
          placeholder="What did you do? e.g. 5km run + core circuit"
          value={notesInput}
          onChange={(e) => setNotesInput(e.target.value)}
          className="w-full bg-white border border-gray-200 focus:border-[#2ECC71] text-gray-900 font-medium text-sm py-2.5 px-3 rounded-xl transition outline-none resize-none h-16"
        />
      ) : (
        <p className="text-[10px] text-gray-400 font-medium">
          Pre-filled estimate for a ~1 hour session — adjust it if yours ran longer or shorter.
        </p>
      )}
    </form>
  );

  const workoutRow = (name: WorkoutName, label: string) => {
    const logEntry = getWorkoutLog(name);
    const isCompleted = logEntry?.completed || false;
    const routine = ROUTINES[location][name];
    const isRoutineOpen = openRoutine === name;
    const isPending = pendingName === name;

    return (
      <div key={name} className="space-y-0">
        <div
          onClick={onToggle ? () => handleRowClick(name, isCompleted) : undefined}
          className={`p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
            onToggle ? "cursor-pointer group " : ""
          }${togglingName === name ? "opacity-50 pointer-events-none " : ""}${
            isCompleted
              ? "bg-[#2ECC71]/10 border-[#2ECC71] text-gray-900"
              : isPending
              ? "bg-white border-gray-300 text-gray-800"
              : onToggle
              ? "bg-gray-50 hover:bg-white border-gray-100 hover:border-gray-200 text-gray-800"
              : "bg-gray-50 border-gray-100 text-gray-800"
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {isCompleted ? (
                <CheckSquare className="w-6 h-6 text-[#2ECC71] animate-pop" />
              ) : (
                <Square className="w-6 h-6 text-gray-400 group-hover:text-gray-900 transition" />
              )}
            </div>
            <div>
              <h4 className="text-base font-extrabold">{label}</h4>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                {routine ? `${routine.workout.length} exercises` : "Resistance Training"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isCompleted && (
              <span className="font-mono text-xs font-bold bg-white text-gray-600 px-3 py-1 border border-gray-100 rounded-full flex items-center space-x-1 shadow-2xs">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>+{logEntry!.calories_burned} kcal</span>
              </span>
            )}
            {isCompleted && logEntry?.completed_at && (
              <span className="text-[10px] bg-[#2ECC71] text-[#111111] px-2 py-1 rounded-md font-bold font-mono">
                Done {formatShortDate(logEntry.completed_at)}
              </span>
            )}
            {routine && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenRoutine(isRoutineOpen ? null : name);
                }}
                title={isRoutineOpen ? "Hide routine" : "View routine"}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-100 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 text-[10px] font-bold uppercase tracking-wider transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Routine</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isRoutineOpen ? "rotate-180" : ""}`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Inline calories-burned entry, shown while completing */}
        <Expand open={isPending}>{entryForm(false, isPending)}</Expand>

        {/* Read-only exercise routine for the selected Gym/Home variant */}
        {routine && (
          <Expand open={isRoutineOpen}>
            <div className="mx-2 p-4 bg-gray-50 border border-t-0 border-gray-100 rounded-b-2xl space-y-3 text-xs">
              <RoutineSection title="Warm Up" items={routine.warmup} />
              <RoutineSection title="Workout" items={routine.workout} />
              {routine.finisher.length > 0 && (
                <RoutineSection title="Optional Finisher (pick one)" items={routine.finisher} />
              )}
            </div>
          </Expand>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs lg:col-span-3 space-y-4" id="weekly-workout-card">
      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">Week {viewWeek} Workouts</h2>
          <p className="text-xs text-gray-400 font-medium">
            {isCurrentActiveWeek
              ? `Pick any sets that fit your week — ${WEEKLY_GOAL} sessions is the goal`
              : "A past week"}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              onChangeWeek(-1);
              setToggleError("");
              resetEntry();
            }}
            disabled={viewWeek <= 1}
            title="Previous week"
            className="p-1.5 rounded-lg border border-gray-100 text-gray-500 hover:bg-gray-50 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
            Week {viewWeek}
          </span>
          <button
            type="button"
            onClick={() => {
              onChangeWeek(1);
              setToggleError("");
              resetEntry();
            }}
            disabled={viewWeek >= currentWeekNum}
            title="Next week"
            className="p-1.5 rounded-lg border border-gray-100 text-gray-500 hover:bg-gray-50 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Gym/Home routine variant - affects the exercise lists only */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Exercise routines</span>
        <div className="flex rounded-lg border border-gray-100 overflow-hidden text-xs font-bold">
          {(["gym", "home"] as const).map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setLocation(loc)}
              className={`px-4 py-1.5 uppercase tracking-wider transition cursor-pointer ${
                location === loc ? "bg-[#2ECC71] text-[#111111]" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {toggleError && (
        <p className="flex items-center space-x-2 text-xs text-red-600 font-bold bg-red-50 px-4 py-3 rounded-xl border border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{toggleError}</span>
        </p>
      )}

      {/* All sets from both plans, grouped - mix them freely in a week */}
      <div className="space-y-5" id="workouts-list">
        {WORKOUT_PLANS.map((plan) => (
          <div key={plan.title} className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{plan.title}</h3>
            {plan.sets.map(({ name, label }) => workoutRow(name, label))}
          </div>
        ))}

        {/* The client's own training, one weekly total they calculate */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Personal Workout Routine</h3>
          <div className="space-y-0">
            <div
              className={`p-5 rounded-2xl border transition-all duration-200 ${
                personal?.completed
                  ? "bg-[#2ECC71]/10 border-[#2ECC71]"
                  : pendingName === "Personal"
                  ? "bg-white border-gray-300"
                  : "bg-gray-50 border-gray-100"
              } ${togglingName === "Personal" ? "opacity-50 pointer-events-none" : ""}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center space-x-4 min-w-0">
                  <NotebookPen
                    className={`w-6 h-6 flex-shrink-0 ${personal?.completed ? "text-[#2ECC71]" : "text-gray-400"}`}
                  />
                  <div className="min-w-0">
                    <h4 className="text-base font-extrabold text-gray-900">Your Own Training</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Not following the plan? Log the whole week's burn yourself — it counts toward
                      your deficit, you do the math.
                    </p>
                  </div>
                </div>
                {onToggle && (
                  <div className="flex items-center gap-2 shrink-0">
                    {personal?.completed && (
                      <span className="font-mono text-xs font-bold bg-white text-gray-600 px-3 py-1 border border-gray-100 rounded-full flex items-center space-x-1 shadow-2xs">
                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                        <span>+{personal.calories_burned} kcal</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setToggleError("");
                        openEntry("Personal");
                      }}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                    >
                      {personal?.completed ? "Edit" : "Log Week"}
                    </button>
                    {personal?.completed && (
                      <button
                        type="button"
                        onClick={() =>
                          uncheck(
                            "Personal",
                            `Remove this week's personal workout? Its +${personal.calories_burned} kcal comes off this week.`
                          )
                        }
                        className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-red-600 hover:border-red-100 text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
              {personal?.completed && personal.notes && (
                <p className="flex items-start gap-1.5 text-xs text-gray-600 font-medium mt-3 bg-white border border-gray-100 rounded-xl px-3 py-2">
                  <StickyNote className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                  <span>{personal.notes}</span>
                </p>
              )}
            </div>
            <Expand open={pendingName === "Personal"}>
              {entryForm(true, pendingName === "Personal")}
            </Expand>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoutineSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-bold text-gray-400 uppercase tracking-wider mb-1.5">{title}</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item} className="text-gray-700 font-medium flex items-start">
            <span className="text-[#2ECC71] font-bold mr-2">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
