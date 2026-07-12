import React, { useEffect, useState } from "react";

interface ExpandProps {
  open: boolean;
  // Compensates a parent `space-y-3` so the collapsed wrapper adds no gap:
  // -mt-3 on the wrapper, pt-3 restored inside the clipped area.
  gap?: boolean;
  children: React.ReactNode;
}

const TRANSITION_MS = 300;

// Smooth height expansion, CSS-only: grid-template-rows 0fr -> 1fr animates
// the actual height, so surrounding layout slides instead of jumping
// (keyframes on the content can't do this - the container would still snap).
// Children stay mounted while collapsed; `inert` keeps them untabbable.
export default function Expand({ open, gap = false, children }: ExpandProps) {
  // Clipping is only needed while the height animates; once settled open,
  // release it so hover effects (e.g. button scale) aren't shaved at the
  // edges. A timer beats transitionend: it also fires under reduced motion.
  const [settled, setSettled] = useState(open);
  useEffect(() => {
    if (!open) {
      setSettled(false);
      return;
    }
    const timer = setTimeout(() => setSettled(true), TRANSITION_MS + 20);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <div
      inert={!open}
      className={`grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none ${
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }${gap ? " -mt-3" : ""}`}
    >
      <div
        className={`${
          open && settled ? "overflow-visible" : "overflow-hidden"
        } transition-opacity duration-300 motion-reduce:transition-none ${
          open ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className={gap ? "pt-3" : undefined}>{children}</div>
      </div>
    </div>
  );
}
