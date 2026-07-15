import { PROGRAM_WEEKS } from "../../data";

// The pace track: 12 segments, one per program week. The green fill is
// actual progress toward the goal; the tick marks where the fill should be
// by now (elapsed weeks / 12). Fill lagging the tick = behind pace -
// readable at a glance, no numbers.
interface PaceTrackProps {
  goalKg: number;
  lost: number;
  week: number; // elapsed program weeks: 0 (not started) .. 12
  dark?: boolean;
}

export default function PaceTrack({ goalKg, lost, week, dark = false }: PaceTrackProps) {
  const pct = goalKg > 0 ? Math.min(1, Math.max(0, lost / goalKg)) : 0;

  return (
    <div className="relative">
      <div className="flex gap-[3px]">
        {Array.from({ length: PROGRAM_WEEKS }, (_, i) => {
          const fill = Math.min(1, Math.max(0, pct * PROGRAM_WEEKS - i));
          return (
            <span
              key={i}
              className={`flex-1 h-2 rounded-[3px] overflow-hidden ${
                dark ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <span
                className="block h-full bg-[#FEC63F] transition-all duration-500"
                style={{ width: `${fill * 100}%` }}
              />
            </span>
          );
        })}
      </div>

      {week > 0 && (
        <span
          title={`Expected progress by week ${week}`}
          className={`absolute -top-1 -bottom-1 w-0.5 rounded-full -translate-x-1/2 ${
            dark ? "bg-white/70" : "bg-gray-900/50"
          }`}
          style={{ left: `${(week / PROGRAM_WEEKS) * 100}%` }}
        />
      )}
    </div>
  );
}

// The track's story as a precise chip: kg ahead of / behind the straight-line
// pace to the goal. Null when there's no pace to compare against yet.
export function paceDelta(
  goalKg: number,
  lost: number,
  week: number
): { label: string; cls: string; clsDark: string } | null {
  if (goalKg <= 0 || week <= 0) return null;
  const delta = parseFloat((lost - (goalKg * week) / PROGRAM_WEEKS).toFixed(1));
  if (delta < -0.2) {
    return {
      label: `${Math.abs(delta)} kg behind`,
      cls: "bg-orange-100 text-orange-800",
      clsDark: "bg-orange-500/20 text-orange-300"
    };
  }
  return {
    label: delta > 0.2 ? `${delta} kg ahead` : "on pace",
    cls: "bg-[#FEC63F]/10 text-[#A66A00]",
    clsDark: "bg-[#FEC63F]/20 text-[#FEC63F]"
  };
}
