"use client";
import { useEffect, useState } from "react";

const MIN = 140;
const MAX = 165;
const DELTAS = [-2, -1, 1, 2];

// Animated "live users" badge for the home page. Starts at a stable value
// for SSR, then randomizes on mount and drifts every few seconds. Bounds
// keep it believable.
export function LiveUsersBadge({ template }: { template: string }) {
  const [count, setCount] = useState(150);

  useEffect(() => {
    setCount(MIN + 5 + Math.floor(Math.random() * (MAX - MIN - 10)));

    const tick = () => {
      setCount((prev) => {
        const delta = DELTAS[Math.floor(Math.random() * DELTAS.length)];
        const next = prev + delta;
        if (next < MIN) return MIN + 2;
        if (next > MAX) return MAX - 2;
        return next;
      });
    };
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-pill bg-white border border-border px-3 py-1 mb-5 text-xs text-text-secondary">
      <span className="live-dot" aria-hidden />
      <span aria-live="polite">{template.replace(/\{count\}/g, String(count))}</span>
    </div>
  );
}
