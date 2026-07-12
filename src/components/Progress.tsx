import { User } from "../types";
import { UserCalculations, PROGRAM_WEEKS } from "../data";
import PaceTrack, { paceDelta } from "./coach/PaceTrack";
import CountUp from "./coach/CountUp";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Flame, Activity, TrendingDown } from "lucide-react";

interface ProgressProps {
  user: User;
  calculations: UserCalculations;
}

export default function Progress({ user, calculations }: ProgressProps) {
  const {
    totalCalorieDeficit,
    totalWeightLost,
    weeklySummaries,
    currentWeekNum,
    programStatus,
  } = calculations;

  // Weeks that have actually happened: none before the program starts
  const elapsedWeekNum = programStatus === "not_started" ? 0 : currentWeekNum;

  const goalKg = parseFloat((user.starting_weight - user.target_weight).toFixed(1));
  const paceWeek = programStatus === "completed" ? 12 : elapsedWeekNum;
  const pace = paceDelta(goalKg, totalWeightLost, paceWeek);

  // "Will I make it?" - current rate extended to week 12
  const projectedKg =
    programStatus === "active" && elapsedWeekNum > 0
      ? parseFloat(((totalWeightLost / elapsedWeekNum) * PROGRAM_WEEKS).toFixed(1))
      : null;

  // Cumulative chart data for weeks that have happened (1..current week)
  let cumulativeWeightLostSoFar = 0;

  const chartData = weeklySummaries
    .filter((summary) => summary.week <= elapsedWeekNum)
    .map((summary) => {
      cumulativeWeightLostSoFar += summary.weight_lost;
      return {
        name: `Week ${summary.week}`,
        estimated_weight: parseFloat((user.starting_weight - cumulativeWeightLostSoFar).toFixed(2)),
      };
    });

  const totalWorkoutCaloriesBurned = weeklySummaries
    .filter((s) => s.week <= elapsedWeekNum)
    .reduce((sum, item) => sum + item.calories_burned, 0);

  // Custom tooltips styling for Recharts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111111] text-white p-4 rounded-xl border border-gray-800 shadow-lg text-xs font-sans">
          <p className="font-extrabold text-[#2ECC71] mb-1.5">{label}</p>
          <p className="font-mono text-gray-300">
            Est. Weight: <span className="font-bold text-white">{payload[0].value} kg</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="progress-screen">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Your Progress</h1>
        <p className="text-sm text-gray-500 mt-1">
          Estimated weight loss from your calorie deficit — roughly 7,700 kcal per kilogram.
        </p>
      </div>

      {/* Pace vs plan: fill = progress to goal, tick = where this week says
          you should be */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3" id="goal-pace-card">
        <div className="flex justify-between items-baseline gap-2">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Goal Pace</h3>
          <span className="flex items-center gap-2">
            {pace && (
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${pace.cls}`}>
                {pace.label}
              </span>
            )}
            <span className="text-sm font-mono font-bold text-gray-900">
              −{totalWeightLost}
              <span className="text-gray-400 font-medium"> of {goalKg} kg</span>
            </span>
          </span>
        </div>
        <PaceTrack goalKg={goalKg} lost={totalWeightLost} week={paceWeek} />
        <p className="text-[11px] text-gray-400">
          The mark shows where week {Math.max(paceWeek, 1)} of {PROGRAM_WEEKS} expects you to be.
        </p>
      </div>

      {/* Grid of overall milestones */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="progress-milestones">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center space-x-4">
          <div className="bg-[#2ECC71]/10 p-3 rounded-xl text-[#2ECC71]">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Deficit</p>
            <h4 className="text-2xl font-black font-mono mt-1 text-gray-900">
              <CountUp value={totalCalorieDeficit} /> <span className="text-xs font-normal text-gray-500">kcal</span>
            </h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center space-x-4">
          <div className="bg-orange-50 p-3 rounded-xl text-orange-500">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Workout Calories</p>
            <h4 className="text-2xl font-black font-mono mt-1 text-gray-900">
              <CountUp value={totalWorkoutCaloriesBurned} /> <span className="text-xs font-normal text-gray-500">kcal</span>
            </h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center space-x-4">
          <div className="bg-[#111111] p-3 rounded-xl text-[#2ECC71]">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              {projectedKg !== null ? "Projected by Week 12" : "Est. Weight Lost"}
            </p>
            <h4 className="text-2xl font-black font-mono mt-1 text-[#2ECC71]">
              {projectedKg !== null ? (
                <>
                  −{projectedKg} <span className="text-xs font-normal text-gray-500">of {goalKg} kg goal</span>
                </>
              ) : (
                <>
                  {totalWeightLost} <span className="text-xs font-normal text-gray-500">kg</span>
                </>
              )}
            </h4>
          </div>
        </div>
      </div>

      {/* Weight loss Trend Line Chart */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4" id="trend-chart-card">
        <div>
          <h3 className="text-base font-bold text-gray-900">Weight Loss Trend</h3>
          <p className="text-xs text-gray-400">Estimated weight each week, based on your logged deficits (started at {user.starting_weight} kg)</p>
        </div>

        {/* An axes-only chart reads as broken, so empty gets a message */}
        {programStatus === "not_started" ? (
          <div className="h-40 flex items-center justify-center text-center">
            <p className="text-sm text-gray-400 font-medium">
              Your program starts on{" "}
              <span className="font-bold font-mono text-gray-600">{user.program_start_date}</span>{" "}
              — your progress will show up here.
            </p>
          </div>
        ) : (
          <div className="w-full h-80 pt-4" id="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
              >
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
                    value: `target ${user.target_weight} kg`,
                    position: "insideBottomLeft",
                    fill: "#9ca3af",
                    fontSize: 10,
                    fontWeight: 700
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* One series only: sharing an axis with the ~0-2 kg loss
                    line flattened this into two unreadable horizontal lines */}
                <Line
                  name="Estimated Weight (kg)"
                  type="monotone"
                  dataKey="estimated_weight"
                  stroke="#2ECC71"
                  strokeWidth={3}
                  dot={{ r: 5, stroke: "#2ECC71", strokeWidth: 2, fill: "#FFFFFF" }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {programStatus === "active" && chartData.length < 2 && (
          <p className="text-xs text-gray-400 text-center">
            Your trend line appears from Week 2 — keep logging!
          </p>
        )}
      </div>

      {/* Weekly Breakdown Grid */}
      <div className="space-y-4" id="weekly-cards-section">
        <h3 className="text-lg font-extrabold text-gray-900">Week by Week</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="weekly-cards-grid">
          {weeklySummaries.map((summary) => {
            const isLogged = summary.week <= elapsedWeekNum;

            // Upcoming weeks are stubs - three rows of dashes say nothing
            if (!isLogged) {
              return (
                <div
                  key={summary.week}
                  className="p-5 rounded-2xl border bg-gray-50 border-gray-100 opacity-60 flex justify-between items-center"
                >
                  <span className="text-xs font-black font-mono tracking-wider uppercase bg-gray-100 text-gray-600 px-3 py-1 rounded-full border border-gray-200">
                    Week {summary.week}
                  </span>
                  <span className="text-[10px] text-gray-400 font-extrabold bg-gray-200 px-2 py-0.5 rounded uppercase">
                    Upcoming
                  </span>
                </div>
              );
            }

            return (
              <div key={summary.week} className="p-5 rounded-2xl border bg-white border-gray-100 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-black font-mono tracking-wider uppercase bg-gray-100 text-gray-600 px-3 py-1 rounded-full border border-gray-200">
                    Week {summary.week}
                  </span>
                  {summary.week === elapsedWeekNum && programStatus === "active" ? (
                    <span className="text-[10px] text-amber-800 font-extrabold bg-amber-100 px-2 py-0.5 rounded uppercase">
                      In Progress
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-800 font-extrabold bg-[#2ECC71]/15 px-2 py-0.5 rounded uppercase">
                      Done
                    </span>
                  )}
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-sans">Calories Burned:</span>
                    <span className="font-bold text-gray-900">{summary.calories_burned} kcal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-sans">Weekly Deficit:</span>
                    <span className="font-bold text-gray-900">{summary.deficit.toLocaleString()} kcal</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-50 font-sans font-bold">
                    <span className="text-gray-500">Est. Weight Loss:</span>
                    <span className="text-[#2ECC71] font-mono">{summary.weight_lost} kg</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
