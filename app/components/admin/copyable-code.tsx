"use client";

import { useEffect, useRef, useState } from "react";

export function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Copy failed", error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
    >
      الكود: {code}
      <span>{copied ? "اتنسخ! ✓" : "📋"}</span>
    </button>
  );
}
