import { User } from "../../types";
import { ProgramStatus } from "../../data";
import { Activity, Calendar, Dumbbell, CheckCircle2, Flame } from "lucide-react";

interface ClientCtaCardProps {
  user: User;
  programStatus: ProgramStatus;
  weekWorkoutsDone: number;
  loggedToday: boolean;
  onNavigate: (tab: string) => void;
}

// "Up next": the one incomplete thing, not a permanent billboard. Workouts
// left this week -> prompt them; then today's log; then a genuine done state.
export default function ClientCtaCard({
  user,
  programStatus,
  weekWorkoutsDone,
  loggedToday,
  onNavigate
}: ClientCtaCardProps) {
  const workoutsLeft = user.workout_frequency - weekWorkoutsDone;

  if (programStatus === "not_started") {
    return (
      <div className="bg-[#111111] p-6 rounded-2xl text-white flex flex-col justify-center space-y-3" id="dashboard-cta-card">
        <Activity className="w-8 h-8 text-[#2ECC71]" />
        <h3 className="text-lg font-extrabold tracking-tight">Get Ready</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          Your program starts on {user.program_start_date}. Logging opens that day — see you at Week 1!
        </p>
      </div>
    );
  }

  if (programStatus === "completed") {
    return (
      <div className="bg-[#111111] p-6 rounded-2xl text-white flex flex-col justify-between" id="dashboard-cta-card">
        <div className="space-y-3">
          <Activity className="w-8 h-8 text-[#2ECC71]" />
          <h3 className="text-lg font-extrabold tracking-tight">12 Weeks Done</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            The program is complete — look back at how far you've come.
          </p>
        </div>
        <div className="mt-6 space-y-2">
          <button
            onClick={() => onNavigate("daily")}
            className="w-full bg-[#2ECC71] hover:bg-[#27ae60] text-[#111111] font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Review Your Days</span>
          </button>
          <button
            onClick={() => onNavigate("workout")}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center space-x-2 border border-gray-700 cursor-pointer"
          >
            <Dumbbell className="w-4 h-4 text-[#2ECC71]" />
            <span>Review Your Workouts</span>
          </button>
        </div>
      </div>
    );
  }

  // Active: surface the next incomplete thing
  if (workoutsLeft > 0) {
    return (
      <div className="bg-[#111111] p-6 rounded-2xl text-white flex flex-col justify-between" id="dashboard-cta-card">
        <div className="space-y-3">
          <Dumbbell className="w-8 h-8 text-[#2ECC71]" />
          <h3 className="text-lg font-extrabold tracking-tight">Up Next: Workouts</h3>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: user.workout_frequency }, (_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full ${i < weekWorkoutsDone ? "bg-[#2ECC71]" : "bg-gray-700"}`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            {weekWorkoutsDone} of {user.workout_frequency} done this week —{" "}
            {workoutsLeft === 1 ? "one session left" : `${workoutsLeft} sessions left`}. Check one off when
            it's done.
          </p>
        </div>
        <button
          onClick={() => onNavigate("workout")}
          className="mt-6 w-full bg-[#2ECC71] hover:bg-[#27ae60] text-[#111111] font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Dumbbell className="w-4 h-4" />
          <span>Open This Week's Workouts</span>
        </button>
      </div>
    );
  }

  if (!loggedToday) {
    return (
      <div className="bg-[#111111] p-6 rounded-2xl text-white flex flex-col justify-between" id="dashboard-cta-card">
        <div className="space-y-3">
          <Flame className="w-8 h-8 text-[#2ECC71]" />
          <h3 className="text-lg font-extrabold tracking-tight">Workouts Done ✓</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            All {user.workout_frequency} sessions are in this week. One thing left today: log what you ate.
          </p>
        </div>
        <button
          onClick={() => onNavigate("daily")}
          className="mt-6 w-full bg-[#2ECC71] hover:bg-[#27ae60] text-[#111111] font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          <span>Log Today's Calories</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#111111] p-6 rounded-2xl text-white flex flex-col items-center justify-center text-center space-y-3" id="dashboard-cta-card">
      <div className="w-14 h-14 rounded-full bg-[#2ECC71]/10 flex items-center justify-center">
        <CheckCircle2 className="w-7 h-7 text-[#2ECC71] animate-pop" />
      </div>
      <h3 className="text-lg font-extrabold tracking-tight">All Caught Up</h3>
      <p className="text-xs text-gray-400 leading-relaxed">
        Today is logged and this week's workouts are done. Consistency wins — see you tomorrow.
      </p>
    </div>
  );
}
