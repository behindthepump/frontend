import React from "react";
import { User, DailyCalorie, WorkoutLog } from "../../types";
import {
  calculateUserStats,
  getProgramWeekDates,
  todayStr,
  formatShortDate,
  addDays,
  WORKOUT_SLOTS,
  PROGRAM_WEEKS
} from "../../data";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Scale, Flame, Dumbbell, CalendarCheck, StickyNote, TrendingDown } from "lucide-react";

interface CoachClientReportProps {
  user: User;
  allCalories: DailyCalorie[];
  allWorkouts: WorkoutLog[];
}

// The trainer's lens on one client: the whole 12-week program at a glance
// (compliance grid), goal trajectory, and the client's own notes - instead
// of paging through the client-voiced tracker screens week by week.
export default function CoachClientReport({ user, allCalories, allWorkouts }: CoachClientReportProps) {
  const stats = calculateUserStats(user, allCalories, allWorkouts);
  const today = todayStr();

  const userCalories = allCalories.filter((c) => c.user_id === user.id);
  const caloriesByDate = new Map(userCalories.map((c) => [c.date, c]));
  const userWorkouts = allWorkouts.filter((w) => w.user_id === user.id);
  const slots = WORKOUT_SLOTS[user.workout_frequency];

  const goalKg = parseFloat((user.starting_weight - user.target_weight).toFixed(1));
  const goalPct = goalKg > 0 ? Math.min(100, Math.round((stats.totalWeightLost / goalKg) * 100)) : 0;

  // Elapsed program days (for logging adherence)
  const lastProgramDay = getProgramWeekDates(user, PROGRAM_WEEKS)[6].date;
  let elapsedDays = 0;
  if (stats.programStatus !== "not_started") {
    const end = today < lastProgramDay ? today : lastProgramDay;
    for (let d = user.program_start_date; d <= end; d = addDays(d, 1)) elapsedDays++;
  }
  const loggedDays = userCalories.filter((c) => c.date <= today).length;
  const loggedPct = elapsedDays > 0 ? Math.round((loggedDays / elapsedDays) * 100) : 0;

  const elapsedWeek = stats.programStatus === "not_started" ? 0 : stats.currentWeekNum;

  // Cumulative estimated weight per elapsed week (same math as the client's
  // Progress screen, compacted)
  let cumulativeLost = 0;
  const chartData = stats.weeklySummaries
    .filter((s) => s.week <= elapsedWeek)
    .map((s) => {
      cumulativeLost += s.weight_lost;
      return {
        name: `W${s.week}`,
        weight: parseFloat((user.starting_weight - cumulativeLost).toFixed(2))
      };
    });

  const notes = userCalories
    .filter((c) => c.notes)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  const dayLetters = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="space-y-6 animate-fadeIn" id="coach-client-report">
      {/* Header: who, where they are, goal trajectory */}
      <div className="bg-[#111111] p-6 rounded-2xl text-white border border-gray-800 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight">{user.name}</h1>
            <p className="text-xs text-gray-400 mt-1">
              {stats.programStatus === "not_started"
                ? `Program starts ${user.program_start_date}`
                : stats.programStatus === "completed"
                ? "Program complete • 12 weeks"
                : `Week ${stats.currentWeekNum} of ${PROGRAM_WEEKS} • started ${formatShortDate(user.program_start_date)}`}
              {" • "}{user.workout_frequency}-day split
            </p>
          </div>
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0 ${
              stats.programStatus === "not_started"
                ? "bg-gray-800 text-gray-400"
                : !stats.lastLoggedDate
                ? "bg-orange-500/20 text-orange-300"
                : stats.lastLoggedDate === today
                ? "bg-[#2ECC71]/20 text-[#2ECC71]"
                : "bg-gray-800 text-gray-300"
            }`}
          >
            {stats.programStatus === "not_started"
              ? "Not started"
              : !stats.lastLoggedDate
              ? "Never logged"
              : stats.lastLoggedDate === today
              ? "Logged today"
              : `Last activity ${formatShortDate(stats.lastLoggedDate)}`}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline text-xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Goal Progress</span>
            <span className="font-mono font-bold">
              −{stats.totalWeightLost} <span className="text-gray-500">of {goalKg} kg</span>
              <span className="text-[#2ECC71] ml-2">{goalPct}%</span>
            </span>
          </div>
          <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#2ECC71] h-full rounded-full transition-all duration-500"
              style={{ width: `${goalPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Coach KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportKpi
          Icon={Scale}
          label="Est. Weight"
          value={`${stats.currentWeight} kg`}
          sub={`started ${user.starting_weight} kg`}
        />
        <ReportKpi
          Icon={TrendingDown}
          label="Target"
          value={`${user.target_weight} kg`}
          sub={`${parseFloat((stats.currentWeight - user.target_weight).toFixed(1))} kg to go`}
        />
        <ReportKpi
          Icon={CalendarCheck}
          label="Days Logged"
          value={elapsedDays > 0 ? `${loggedDays}/${elapsedDays}` : "—"}
          sub={elapsedDays > 0 ? `${loggedPct}% of days` : "not started"}
        />
        <ReportKpi
          Icon={Dumbbell}
          label="Workouts"
          value={`${stats.workoutCompletionCount}/${stats.totalWorkouts}`}
          sub={`${user.workout_frequency} per week`}
        />
      </div>

      {/* The whole program at a glance */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">Program Compliance</h2>
          <p className="text-xs text-gray-400">
            Every day and workout of the 12 weeks — no paging.
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[540px] space-y-1">
            {/* Column headers */}
            <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider pb-1">
              <span className="w-9 shrink-0" />
              {dayLetters.map((letter, i) => (
                <span key={i} className="w-5 text-center shrink-0">{letter}</span>
              ))}
              <span className="w-4 shrink-0" />
              <span className="shrink-0">Workouts</span>
              <span className="ml-auto shrink-0">Deficit</span>
            </div>

            {stats.weeklySummaries.map((summary) => {
              const week = summary.week;
              const dates = getProgramWeekDates(user, week);
              const isCurrent = week === elapsedWeek && stats.programStatus === "active";
              const isElapsed = week <= elapsedWeek;
              const weekWorkouts = userWorkouts.filter((w) => w.week === week);

              return (
                <div
                  key={week}
                  className={`flex items-center gap-1 py-1 px-0.5 rounded-lg ${
                    isCurrent ? "bg-[#2ECC71]/5" : ""
                  }`}
                >
                  <span
                    className={`w-9 shrink-0 text-[10px] font-bold font-mono ${
                      isCurrent ? "text-[#2ECC71]" : isElapsed ? "text-gray-600" : "text-gray-300"
                    }`}
                  >
                    W{week}
                  </span>

                  {dates.map(({ date }) => {
                    const entry = caloriesByDate.get(date);
                    const isFuture = date > today;
                    return (
                      <span
                        key={date}
                        title={
                          entry
                            ? `${date}: ${entry.calories} kcal${entry.notes ? ` — ${entry.notes}` : ""}`
                            : isFuture
                            ? date
                            : `${date}: not logged`
                        }
                        className={`w-5 h-5 rounded-md shrink-0 ${
                          entry ? "bg-[#2ECC71]" : isFuture ? "bg-gray-100" : "bg-amber-200"
                        }`}
                      />
                    );
                  })}

                  <span className="w-4 shrink-0" />

                  <span className="flex items-center gap-1 shrink-0">
                    {slots.map((slot) => {
                      const log = weekWorkouts.find((w) => w.workout_name === slot);
                      const done = log?.completed === true;
                      return (
                        <span
                          key={slot}
                          title={
                            done
                              ? `${slot}: done${log?.completed_at ? ` ${formatShortDate(log.completed_at)}` : ""} (+${log?.calories_burned} kcal)`
                              : `${slot}: not done`
                          }
                          className={`w-3 h-3 rounded-full shrink-0 ${
                            done
                              ? "bg-[#111111]"
                              : isElapsed
                              ? "border-2 border-gray-300"
                              : "border-2 border-gray-100"
                          }`}
                        />
                      );
                    })}
                  </span>

                  <span
                    className={`ml-auto shrink-0 text-[10px] font-bold font-mono ${
                      !isElapsed
                        ? "text-gray-300"
                        : summary.deficit < 0
                        ? "text-orange-500"
                        : "text-gray-600"
                    }`}
                  >
                    {isElapsed ? `${summary.deficit.toLocaleString()} kcal` : "—"}
                  </span>
                </div>
              );
            })}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-[10px] text-gray-400 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#2ECC71]" /> logged
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-200" /> missed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-gray-100" /> upcoming
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#111111]" /> workout done
              </span>
              <span className="text-gray-300">• hover any cell for detail</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Weight trend */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs lg:col-span-3 space-y-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">Weight Trend</h3>
            <p className="text-xs text-gray-400">
              Estimated from logged deficits (7,700 kcal ≈ 1 kg)
            </p>
          </div>
          {chartData.length >= 2 ? (
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#9ca3af", fontSize: 10, fontWeight: "bold" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={["dataMin - 1", "dataMax + 1"]}
                    tick={{ fill: "#9ca3af", fontSize: 10, fontWeight: "bold" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#111111",
                      border: "1px solid #1f2937",
                      borderRadius: 12,
                      fontSize: 11,
                      color: "#fff"
                    }}
                    formatter={(value) => [`${value} kg`, "Est. weight"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#2ECC71"
                    strokeWidth={3}
                    dot={{ r: 4, stroke: "#2ECC71", strokeWidth: 2, fill: "#FFFFFF" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-10 text-center">
              The trend appears from Week 2 of the program.
            </p>
          )}
        </div>

        {/* Client's food notes - coaching signal */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs lg:col-span-2 space-y-3">
          <div className="flex items-center space-x-2">
            <StickyNote className="w-4 h-4 text-[#2ECC71]" />
            <h3 className="text-base font-bold text-gray-900">Recent Notes</h3>
          </div>
          {notes.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">
              No notes yet — anything {user.name} writes on a daily log shows up here.
            </p>
          ) : (
            <ul className="space-y-2">
              {notes.map((entry) => (
                <li key={entry.date} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                  <div className="flex justify-between items-baseline gap-2 text-[10px] font-bold font-mono">
                    <span className="text-gray-500">{formatShortDate(entry.date)}</span>
                    <span className="text-gray-900 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-400" />
                      {entry.calories} kcal
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 font-medium mt-1">{entry.notes}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportKpi({
  Icon,
  label,
  value,
  sub
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center space-x-3">
      <div className="bg-gray-50 p-2.5 rounded-xl shrink-0">
        <Icon className="w-5 h-5 text-[#2ECC71]" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-lg font-black font-mono text-gray-900 truncate">{value}</p>
        <p className="text-[10px] text-gray-400 font-medium truncate">{sub}</p>
      </div>
    </div>
  );
}
