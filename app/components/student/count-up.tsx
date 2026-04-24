"use client";

import { useEffect, useState } from "react";

export function CountUp({
  value,
  duration = 800,
}: {
  value: number;
  duration?: number;
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    const from = current;
    const diff = value - from;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCurrent(Math.round(from + diff * progress));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span>{current}</span>;
}
