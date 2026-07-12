import React from "react";

// Counts as instrument lights: ●●○ is judged at a glance, "2/3" is read.
// The exact numbers live in the tooltip.
export default function DotMeter({
  Icon,
  filled,
  total,
  title,
  dark = false
}: {
  Icon: React.ComponentType<{ className?: string }>;
  filled: number;
  total: number;
  title: string;
  dark?: boolean;
}) {
  return (
    <span className="flex items-center gap-[5px]" title={title}>
      <Icon className={`w-3.5 h-3.5 mr-0.5 ${dark ? "text-gray-500" : "text-gray-400"}`} />
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i < filled
              ? dark
                ? "bg-[#2ECC71]"
                : "bg-[#111111]"
              : dark
              ? "bg-gray-700"
              : "bg-gray-200"
          }`}
        />
      ))}
    </span>
  );
}
