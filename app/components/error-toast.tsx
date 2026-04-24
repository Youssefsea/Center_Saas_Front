"use client";

import { useEffect } from "react";
import { TOAST_DURATION_MS } from "../lib/constants";

type ToastType = "error" | "success" | "warning";

const typeStyles: Record<ToastType, string> = {
  error: "border-error/30 bg-error/10 text-error",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-accent/30 bg-accent/10 text-accent",
};

export function ErrorToast({
  message,
  type = "error",
  onClose,
}: {
  message: string;
  type?: ToastType;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed left-4 top-4 z-[60] rounded-2xl border px-4 py-3 text-sm shadow-card ${typeStyles[type]}`}
    >
      {message}
    </div>
  );
}
