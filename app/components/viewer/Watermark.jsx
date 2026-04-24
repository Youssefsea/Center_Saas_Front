"use client";

import { useEffect, useState } from "react";

const instanceBaseStyle = {
  position: "absolute",
  fontSize: "13px",
  fontFamily: "monospace",
  lineHeight: "1.6",
  textAlign: "center",
  pointerEvents: "none",
  whiteSpace: "nowrap",
};

const DEFAULT_COLORS = [
  "rgba(255,255,255,0.18)",
  "rgba(148,163,184,0.2)",
  "rgba(125,211,252,0.2)",
  "rgba(196,181,253,0.2)",
];

const PDF_COLORS = [
  "rgba(15,23,42,0.32)",
  "rgba(79,70,229,0.32)",
  "rgba(190,24,93,0.28)",
  "rgba(6,95,70,0.3)",
];

const WatermarkInstance = ({ name, email, timeStr, dateStr, style }) => (
  <div style={{ ...instanceBaseStyle, ...style }}>
    {name}
    <br />
    {email}
    <br />
    {dateStr} {timeStr}
  </div>
);

export const Watermark = ({ name, email, variant = "default" }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(clockInterval);
    };
  }, []);

  const timeStr = time.toLocaleTimeString("ar-EG");
  const dateStr = time.toLocaleDateString("ar-EG");
  const colors = variant === "pdf" ? PDF_COLORS : DEFAULT_COLORS;
  const tick = time.getSeconds();
  const getColor = (offset) => colors[(tick + offset) % colors.length];
  const commonStyle =
    variant === "pdf"
      ? {
          mixBlendMode: "multiply",
          textShadow: "0 0 1px rgba(255,255,255,0.15)",
          backgroundColor: "rgba(255,255,255,0.45)",
          borderRadius: "6px",
          padding: "2px 8px",
        }
      : {
          textShadow: "0 0 6px rgba(15,23,42,0.35)",
        };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 10,
        overflow: "hidden",
      }}
    >
      <WatermarkInstance
        name={name}
        email={email}
        timeStr={timeStr}
        dateStr={dateStr}
        style={{
          ...commonStyle,
          top: "16px",
          right: "16px",
          opacity: variant === "pdf" ? 0.45 : 0.14,
          color: getColor(0),
        }}
      />
      <WatermarkInstance
        name={name}
        email={email}
        timeStr={timeStr}
        dateStr={dateStr}
        style={{
          ...commonStyle,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(-25deg)",
          opacity: variant === "pdf" ? 0.52 : 0.2,
          color: getColor(1),
        }}
      />
      <WatermarkInstance
        name={name}
        email={email}
        timeStr={timeStr}
        dateStr={dateStr}
        style={{
          ...commonStyle,
          bottom: "16px",
          left: "16px",
          opacity: variant === "pdf" ? 0.45 : 0.14,
          color: getColor(2),
        }}
      />
    </div>
  );
};
