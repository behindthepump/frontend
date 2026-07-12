import React from "react";
import { User, DailyCalorie } from "../../types";
import { getProgramWeekDates, todayStr as getTodayStr } from "../../data";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface CalorieCalendarProps {
  user: User;
  allCalories: DailyCalorie[];
  viewWeek: number;
  currentWeekNum: number;
  onChangeWeek: (delta: number) => void;
  // Passing onSelectDay makes days tappable (client). Omit for a read-only
  // display (coach).
  selectedDate?: string;
  onSelectDay?: (date: string) => void;
}

export default function CalorieCalendar({
  user,
  allCalories,
  viewWeek,
  currentWeekNum,
  onChangeWeek,
  selectedDate,
  onSelectDay
}: CalorieCalendarProps) {
  const todayStr = getTodayStr();
  const viewWeekDates = getProgramWeekDates(user, viewWeek);

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs" id="calendar-view">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-bold text-gray-700 font-mono tracking-wider uppercase flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-[#2ECC71]" />
          <span>Week {viewWeek} Calorie Entries</span>
        </h2>
        <div className="flex items-center space-x-2">
          {onSelectDay && <span className="text-xs text-gray-400">Tap a day to log it</span>}
          <button
            type="button"
            onClick={() => onChangeWeek(-1)}
            disabled={viewWeek <= 1}
            title="Previous week"
            className="p-1.5 rounded-lg border border-gray-100 text-gray-500 hover:bg-gray-50 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onChangeWeek(1)}
            disabled={viewWeek >= currentWeekNum}
            title="Next week"
            className="p-1.5 rounded-lg border border-gray-100 text-gray-500 hover:bg-gray-50 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2" id="calendar-grid">
        {viewWeekDates.map((item) => {
          const hasLog = allCalories.find((c) => c.user_id === user.id && c.date === item.date);
          const isSelected = Boolean(onSelectDay) && selectedDate === item.date;
          const isToday = item.date === todayStr;
          const isFuture = item.date > todayStr;
          const isMissed = !hasLog && !isFuture && !isToday;
          const interactive = Boolean(onSelectDay) && !isFuture;

          return (
            <button
              key={item.date}
              type="button"
              disabled={isFuture || !onSelectDay}
              onClick={interactive ? () => onSelectDay!(item.date) : undefined}
              className={`flex flex-col items-center justify-between py-3 px-2 rounded-xl border transition-all ${
                isFuture
                  ? "bg-gray-50 text-gray-300 border-gray-100 opacity-50 cursor-not-allowed"
                  : isSelected
                  ? "bg-[#111111] text-white border-[#111111] scale-102 shadow-sm"
                  : isToday
                  ? `bg-[#2ECC71]/10 text-gray-900 border-[#2ECC71]${interactive ? " hover:bg-[#2ECC71]/20" : ""}`
                  : isMissed
                  ? `bg-amber-50/60 text-gray-800 border-amber-100${interactive ? " hover:bg-amber-50" : ""}`
                  : `bg-gray-50 text-gray-800 border-gray-100${interactive ? " hover:bg-gray-100" : ""}`
              }${isFuture ? "" : interactive ? " cursor-pointer" : " cursor-default"}`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                {item.label}
              </span>

              {hasLog ? (
                <span className="text-sm font-black font-mono mt-2 flex items-center">
                  {hasLog.calories}
                  {hasLog.notes && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ml-1 ${
                        isSelected ? "bg-[#2ECC71]" : "bg-blue-400"
                      }`}
                      title="Has a note"
                    />
                  )}
                </span>
              ) : isMissed ? (
                <span className={`text-[9px] font-bold uppercase mt-2 ${isSelected ? "text-amber-300" : "text-amber-600"}`}>
                  Missed
                </span>
              ) : (
                <span className="text-xs font-semibold text-gray-400 mt-2">—</span>
              )}

              {isToday && (
                <span className="text-[8px] font-extrabold uppercase mt-1 px-1 rounded bg-[#2ECC71] text-[#111111]">
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
