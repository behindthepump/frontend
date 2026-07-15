import { mondayOf, todayStr, formatShortDate } from "../../data";

// The coach side's urgency scale, in one place - it diverged between the
// roster and the drill-in header once already. Consumers pick a palette.
export type RecencyKey = "not_started" | "never" | "today" | "this_week" | "quiet";

export function recency(
  programStatus: string,
  lastLogged: string | null | undefined
): { key: RecencyKey; label: string } {
  if (programStatus === "not_started") return { key: "not_started", label: "Not started" };
  if (!lastLogged) return { key: "never", label: "Never logged" };
  const today = todayStr();
  if (lastLogged === today) return { key: "today", label: "Logged today" };
  if (lastLogged >= mondayOf(today)) {
    return { key: "this_week", label: `Logged ${formatShortDate(lastLogged)}` };
  }
  return { key: "quiet", label: `Quiet since ${formatShortDate(lastLogged)}` };
}

// Chip palette on white cards
export const RECENCY_CHIP_LIGHT: Record<RecencyKey, string> = {
  not_started: "bg-gray-100 text-gray-500",
  never: "bg-red-100 text-red-700",
  today: "bg-[#FEC63F]/15 text-[#A66A00]",
  this_week: "bg-gray-100 text-gray-600",
  quiet: "bg-orange-100 text-orange-800"
};

// Chip palette on the dark drill-in header
export const RECENCY_CHIP_DARK: Record<RecencyKey, string> = {
  not_started: "bg-gray-800 text-gray-400",
  never: "bg-red-500/20 text-red-300",
  today: "bg-[#FEC63F]/20 text-[#FEC63F]",
  this_week: "bg-gray-800 text-gray-300",
  quiet: "bg-orange-500/20 text-orange-300"
};

// Roster card left-edge colours
export const RECENCY_EDGE: Record<RecencyKey, string> = {
  not_started: "border-l-gray-200",
  never: "border-l-red-400",
  today: "border-l-[#FEC63F]",
  this_week: "border-l-gray-300",
  quiet: "border-l-orange-400"
};
