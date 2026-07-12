import { useEffect, useRef, useState } from "react";

const DURATION_MS = 700;

// Numbers that arrive feel measured, not pasted: a short ease-out count to
// the target on mount and on change. Renders the final value immediately
// under reduced motion. Decimal places mirror the target so the settled
// number matches what a plain render would show.
export default function CountUp({ value }: { value: number }) {
  const decimals = (String(value).split(".")[1] ?? "").length;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [display, setDisplay] = useState(reduced ? value : 0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        fromRef.current = value;
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display.toFixed(decimals)}</>;
}
