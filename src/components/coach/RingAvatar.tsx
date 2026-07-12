// The client's identity plate: initials on a dark disc, wrapped in a goal-
// progress ring - the classic fitness-app glyph. Used on roster cards and
// the drill-in header so the identity thread carries through.
export default function RingAvatar({ name, pct }: { name: string; pct: number }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const R = 21;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg viewBox="0 0 48 48" className="w-12 h-12 -rotate-90">
        <circle cx="24" cy="24" r={R} fill="#111111" />
        <circle cx="24" cy="24" r={R} fill="none" stroke="#333333" strokeWidth="2.5" />
        <circle
          cx="24"
          cy="24"
          r={R}
          fill="none"
          stroke="#2ECC71"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={`${pct * C} ${C}`}
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[13px] font-black font-mono text-[#2ECC71]">
        {initials}
      </span>
    </div>
  );
}
