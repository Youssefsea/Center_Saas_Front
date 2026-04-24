"use client";

import { useCallback, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import useModalKeyboard from "../../hooks/useModalKeyboard";

type QRModalProps = {
  qrCode: string;
  sessionInfo: string;
  onClose: () => void;
};

export function QRModal({ qrCode, sessionInfo, onClose }: QRModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const handleClose = useCallback(() => onClose(), [onClose]);
  const downloadQr = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = "booking-qr.png";
    link.click();
  }, []);

  useModalKeyboard(true, handleClose, closeRef);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 md:items-center">
      <div className="w-full rounded-t-3xl bg-white p-6 shadow-card md:max-w-lg md:rounded-3xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">عرض الـ QR</h3>
          <button
            ref={closeRef}
            type="button"
            onClick={handleClose}
            aria-label="إغلاق"
            className="text-xl"
          >
            ×
          </button>
        </div>
        <div className="mt-6 flex flex-col items-center gap-4">
          <QRCodeCanvas value={qrCode} size={200} ref={canvasRef} />
          <p className="text-sm text-muted">{sessionInfo}</p>
          <p className="text-xs text-muted">
            اتأكد إن الـ QR واضح لما تيجي المركز
          </p>
          <button
            type="button"
            onClick={downloadQr}
            className="btn-ripple w-full rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary"
          >
            تحميل QR
          </button>
        </div>
      </div>
    </div>
  );
}
