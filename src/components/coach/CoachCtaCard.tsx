import React from "react";
import { User } from "../../types";
import { ProgramStatus } from "../../data";
import { Activity, Calendar, Dumbbell } from "lucide-react";

interface CoachCtaCardProps {
  user: User;
  programStatus: ProgramStatus;
  onNavigate: (tab: string) => void;
}

// The coach dashboard's call-to-action: jumps into the read-only logs.
export default function CoachCtaCard({ user, programStatus, onNavigate }: CoachCtaCardProps) {
  return (
    <div className="bg-[#111111] p-6 rounded-2xl text-white flex flex-col justify-between" id="dashboard-cta-card">
      <div className="space-y-3">
        <Activity className="w-8 h-8 text-[#2ECC71]" />
        <h3 className="text-lg font-extrabold tracking-tight">Daily Logs</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          {programStatus === "not_started"
            ? `${user.name}'s program starts on ${user.program_start_date}.`
            : `Tracking ${user.name}'s progress toward ${user.target_weight} kg.`}
        </p>
      </div>

      {programStatus !== "not_started" && (
        <div className="mt-6 space-y-2">
          <button
            onClick={() => onNavigate("daily")}
            className="w-full bg-[#2ECC71] hover:bg-[#27ae60] text-[#111111] font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center space-x-2"
          >
            <Calendar className="w-4 h-4" />
            <span>View Calorie Log</span>
          </button>
          <button
            onClick={() => onNavigate("workout")}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center space-x-2 border border-gray-700"
          >
            <Dumbbell className="w-4 h-4 text-[#2ECC71]" />
            <span>View Workouts</span>
          </button>
        </div>
      )}
    </div>
  );
}
