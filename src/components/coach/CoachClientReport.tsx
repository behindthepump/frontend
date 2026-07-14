import React, { useMemo, useState } from "react";
import { User, DailyCalorie, WorkoutLog } from "../../types";
import {
  calculateUserStats,
  getProgramWeekDates,
  firstLoggableDate,
  todayStr,
  formatShortDate,
  addDays,
  WORKOUT_SETS,
  PROGRAM_WEEKS,
  WEEKLY_GOAL
} from "../../data";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer
} from "recharts";
import { Scale, Flame, Dumbbell, CalendarCheck, StickyNote, TrendingDown } from "lucide-react";
import CountUp from "./CountUp";

interface CoachClientReportProps {
  user: User;
  allCalories: DailyCalorie[];
  allWorkouts: WorkoutLog[];
}

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

// The trainer's lens on one client: the whole 12-week program at a glance
// (compliance grid), goal trajectory, and the client's own notes - instead
// of paging through the client-voiced tracker screens week by week.
export default function CoachClientReport({ user, allCalories, allWorkouts }: CoachClientReportProps) {
  // One fixed-position tooltip for the compliance grid. Native `title` is
  // too slow to feel alive, and an absolute tooltip would clip against the
  // grid's overflow-x-auto scroll container - fixed escapes it.
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  const tipHandlers = (text: string) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      setTip({ text, x: r.left + r.width / 2, y: r.top });
    },
    onMouseLeave: () => setTip(null)
  });

  // Every tooltip show/hide re-renders this component - memoize the derived
  // data so hovering doesn't recompute a program's worth of stats each time.
  const { stats, caloriesByDate, userWorkouts, today, joined, elapsedDays, loggedDays, loggedPct, elapsedWeek, chartData, notes } =
    useMemo(() => {
      const stats = calculateUserStats(user, allCalories, allWorkouts);
      const today = todayStr();
      const joined = firstLoggableDate(user);

      const userCalories = allCalories.filter((c) => c.user_id === user.id);
      const caloriesByDate = new Map(userCalories.map((c) => [c.date, c]));
      const userWorkouts = allWorkouts.filter((w) => w.user_id === user.id);

      // Elapsed loggable days (for adherence) - starts at approval, not the
      // Monday-anchored program start, so pre-join days don't count against
      // the client.
      const lastProgramDay = getProgramWeekDates(user, PROGRAM_WEEKS)[6].date;
      let elapsedDays = 0;
      if (stats.programStatus !== "not_started") {
        const end = today < lastProgramDay ? today : lastProgramDay;
        const start = joined > user.program_start_date ? joined : user.program_start_date;
        for (let d = start; d <= end; d = addDays(d, 1)) elapsedDays++;
      }
      const loggedDays = userCalories.filter((c) => c.date <= today).length;
      const loggedPct = elapsedDays > 0 ? Math.round((loggedDays / elapsedDays) * 100) : 0;

      const elapsedWeek = stats.programStatus === "not_started" ? 0 : stats.currentWeekNum;

      // Cumulative estimated weight per elapsed week (same math as the
      // client's Progress screen, compacted)
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

      // Food-log notes + "Personal" workout notes, newest first - both are
      // the client talking to the coach.
      const notes = [
        ...userCalories
          .filter((c) => c.notes)
          .map((c) => ({ key: `cal-${c.date}`, date: c.date, kcal: c.calories, text: c.notes!, workout: false })),
        ...userWorkouts
          .filter((w) => w.workout_name === "Personal" && w.completed && w.notes)
          .map((w) => ({
            key: `per-${w.week}`,
            date: w.completed_at ?? "",
            kcal: w.calories_burned,
            text: `Week ${w.week} personal workout: ${w.notes!}`,
            workout: true
          }))
      ]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 6);

      return { stats, caloriesByDate, userWorkouts, today, joined, elapsedDays, loggedDays, loggedPct, elapsedWeek, chartData, notes };
    }, [user, allCalories, allWorkouts]);

  // Stable element identity lets React skip the whole recharts subtree on
  // tooltip re-renders.
  const trendChart = useMemo(
    () =>
      chartData.length < 2 ? null : (
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
                // Stretch to keep the target line in frame
                domain={[
                  (dataMin: number) => Math.floor(Math.min(dataMin, user.target_weight) - 1),
                  (dataMax: number) => Math.ceil(dataMax + 1)
                ]}
                tick={{ fill: "#9ca3af", fontSize: 10, fontWeight: "bold" }}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceLine
                y={user.target_weight}
                stroke="#9ca3af"
                strokeDasharray="4 4"
                label={{
                  value: `target ${user.target_weight}`,
                  position: "insideBottomLeft",
                  fill: "#9ca3af",
                  fontSize: 9,
                  fontWeight: 700
                }}
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
      ),
    [chartData, user.target_weight]
  );

  return (
    <div className="space-y-6 animate-fadeIn" id="coach-client-report">
      {/* Coach KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportKpi
          Icon={Scale}
          label="Est. Weight"
          value={<><CountUp value={stats.currentWeight} /> kg</>}
          sub={`started ${user.starting_weight} kg`}
        />
        <ReportKpi
          Icon={TrendingDown}
          label="To Go"
          value={<><CountUp value={parseFloat((stats.currentWeight - user.target_weight).toFixed(1))} /> kg</>}
          sub={`target ${user.target_weight} kg`}
        />
        <ReportKpi
          Icon={CalendarCheck}
          label="Days Logged"
          value={elapsedDays > 0 ? <><CountUp value={loggedDays} />/{elapsedDays}</> : "—"}
          sub={elapsedDays > 0 ? `${loggedPct}% of days` : "not started"}
        />
        <ReportKpi
          Icon={Dumbbell}
          label="Workouts"
          value={<><CountUp value={stats.workoutCompletionCount} />/{stats.totalWorkouts}</>}
          sub={`goal ${WEEKLY_GOAL} per week`}
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
              {DAY_LETTERS.map((letter, i) => (
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
                    const isToday = date === today;
                    // Days before approval were never loggable
                    const isPreJoin = date < joined;
                    // Effort heatmap, not an attendance sheet: green depth
                    // scales with the day's deficit. Today unlogged is
                    // pending, not missed - the day isn't over.
                    const dayDeficit = entry ? user.bmr - entry.calories : 0;
                    const loggedCls =
                      dayDeficit >= 500
                        ? "bg-[#2ECC71]"
                        : dayDeficit > 0
                        ? "bg-[#2ECC71]/60"
                        : "bg-[#2ECC71]/25";
                    return (
                      <span
                        key={date}
                        {...tipHandlers(
                          entry
                            ? `${date}: ${entry.calories} kcal — ${
                                dayDeficit >= 0
                                  ? `${dayDeficit} deficit`
                                  : `${-dayDeficit} surplus`
                              }${entry.notes ? ` — ${entry.notes}` : ""}`
                            : isToday
                            ? `${date}: not logged yet`
                            : isPreJoin
                            ? `${date}: before joining`
                            : isFuture
                            ? date
                            : `${date}: not logged`
                        )}
                        className={`w-5 h-5 rounded-md shrink-0 transition duration-150 hover:scale-125 hover:ring-2 hover:ring-gray-300 ${
                          entry
                            ? loggedCls
                            : isToday
                            ? "bg-white border-2 border-gray-200"
                            : isFuture || isPreJoin
                            ? "bg-gray-100"
                            : "bg-amber-200"
                        }`}
                      />
                    );
                  })}

                  <span className="w-4 shrink-0" />

                  <span className="flex items-center gap-1 shrink-0">
                    {WORKOUT_SETS.map(({ name }) => {
                      const log = weekWorkouts.find((w) => w.workout_name === name);
                      const done = log?.completed === true;
                      return (
                        <span
                          key={name}
                          {...tipHandlers(
                            done
                              ? `${name}: done${log?.completed_at ? ` ${formatShortDate(log.completed_at)}` : ""} (+${log?.calories_burned} kcal)`
                              : `${name}: not done`
                          )}
                          className={`w-3 h-3 rounded-full shrink-0 transition duration-150 hover:scale-125 ${
                            done
                              ? "bg-[#111111]"
                              : isElapsed
                              ? "border-2 border-gray-300"
                              : "border-2 border-gray-100"
                          }`}
                        />
                      );
                    })}
                    {(() => {
                      // The free-form personal entry, only when it exists
                      const per = weekWorkouts.find((w) => w.workout_name === "Personal" && w.completed);
                      return per ? (
                        <span
                          {...tipHandlers(
                            `Personal: +${per.calories_burned} kcal${per.notes ? ` — ${per.notes}` : ""}`
                          )}
                          className="w-3 h-3 rounded-full shrink-0 transition duration-150 hover:scale-125 bg-[#2ECC71]"
                        />
                      ) : null;
                    })()}
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
                <span className="w-3 h-3 rounded-sm bg-[#2ECC71]" />
                <span className="w-3 h-3 rounded-sm bg-[#2ECC71]/60" />
                <span className="w-3 h-3 rounded-sm bg-[#2ECC71]/25" />
                logged — deficit → surplus
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-200" /> missed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-white border-2 border-gray-200" /> today
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-gray-100" /> upcoming
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#111111]" /> workout done
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2ECC71]" /> personal workout
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
          {trendChart ?? (
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
                <li key={entry.key} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                  <div className="flex justify-between items-baseline gap-2 text-[10px] font-bold font-mono">
                    <span className="text-gray-500">{entry.date ? formatShortDate(entry.date) : "—"}</span>
                    <span className="text-gray-900 flex items-center gap-1">
                      {entry.workout ? (
                        <Dumbbell className="w-3 h-3 text-[#2ECC71]" />
                      ) : (
                        <Flame className="w-3 h-3 text-orange-400" />
                      )}
                      {entry.workout ? `+${entry.kcal}` : entry.kcal} kcal
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 font-medium mt-1">{entry.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {tip && (
        <div
          className="fixed z-50 -translate-x-1/2 -translate-y-full pointer-events-none px-3 py-2 rounded-xl bg-[#111111] border border-gray-800 text-white text-[11px] font-medium max-w-64 shadow-lg animate-fadeIn"
          style={{ left: tip.x, top: tip.y - 8 }}
        >
          {tip.text}
        </div>
      )}
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
  value: React.ReactNode;
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
