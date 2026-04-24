"use client";

import { useCallback, useRef } from "react";
import useModalKeyboard from "../../hooks/useModalKeyboard";

export function ConfirmModal({
  title,
  message,
  confirmText,
  confirmColor = "bg-primary",
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmText: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const handleCancel = useCallback(() => onCancel(), [onCancel]);
  const handleConfirm = useCallback(() => onConfirm(), [onConfirm]);

  useModalKeyboard(true, handleCancel, closeRef);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 md:items-center">
      <div className="w-full rounded-t-3xl bg-white p-6 shadow-card md:max-w-lg md:rounded-3xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            ref={closeRef}
            type="button"
            onClick={handleCancel}
            aria-label="إغلاق"
            className="text-xl"
          >
            ×
          </button>
        </div>
        <p className="mt-4 text-sm text-muted">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            className={`btn-ripple flex-1 rounded-full px-4 py-2 text-sm font-semibold text-white ${confirmColor}`}
          >
            {confirmText}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600"
          >
            رجوع
          </button>
        </div>
      </div>
    </div>
  );
}
