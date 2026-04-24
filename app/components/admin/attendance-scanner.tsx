"use client";

import { useEffect, useRef, useState } from "react";
import {
  QR_OVERLAY_ERROR_MS,
  QR_OVERLAY_SUCCESS_MS,
} from "../../lib/constants";

type ScanResponse = {
  status: "success" | "error";
  title: string;
  message: string;
  detail?: string;
};

export function AttendanceScanner({
  sessionId,
  onScan,
}: {
  sessionId: string | null;
  onScan: (qrCode: string) => Promise<ScanResponse>;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<ScanResponse | null>(null);
  const rafRef = useRef<number | null>(null);
  const overlayTimerRef = useRef<number | null>(null);
  const [supported, setSupported] = useState(true);
  const [overlay, setOverlay] = useState<ScanResponse | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    let active = true;
    let stream: MediaStream | null = null;
    let detector: any = null;

    const start = async () => {
      const Detector = (window as any).BarcodeDetector;
      if (!Detector) {
        setSupported(false);
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        detector = new Detector({ formats: ["qr_code"] });
        const scan = async () => {
          if (!active || !videoRef.current || !detector) return;
          try {
            const bitmap = await createImageBitmap(videoRef.current);
            const codes = await detector.detect(bitmap);
            bitmap.close();
            if (codes.length > 0 && overlayRef.current === null) {
              const qrValue = codes[0].rawValue;
              const result = await onScan(qrValue);
              setOverlay(result);
              overlayRef.current = result;
              if (overlayTimerRef.current) {
                clearTimeout(overlayTimerRef.current);
              }
              overlayTimerRef.current = window.setTimeout(() => {
                setOverlay(null);
                overlayRef.current = null;
              }, result.status === "success" ? QR_OVERLAY_SUCCESS_MS : QR_OVERLAY_ERROR_MS);
            }
          } catch (error) {
            console.error("Scan error", error);
          } finally {
            rafRef.current = requestAnimationFrame(scan);
          }
        };
        rafRef.current = requestAnimationFrame(scan);
      } catch (error) {
        console.error("Camera access denied", error);
        setSupported(false);
      }
    };

    if (sessionId) {
      start();
    }

    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [sessionId, onScan]);

  const handleManualSubmit = async () => {
    if (!manualCode) return;
    setManualLoading(true);
    const result = await onScan(manualCode);
    setOverlay(result);
    overlayRef.current = result;
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    overlayTimerRef.current = window.setTimeout(() => {
      setOverlay(null);
      overlayRef.current = null;
    }, result.status === "success" ? QR_OVERLAY_SUCCESS_MS : QR_OVERLAY_ERROR_MS);
    setManualLoading(false);
    setManualCode("");
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          الحضور بيتسجل من 15 دقيقة قبل الحصة لحد 30 دقيقة بعد بدايتها
        </p>
      </div>

      {supported ? (
        <div className="relative mt-4 overflow-hidden rounded-3xl bg-slate-900">
          <video ref={videoRef} className="h-[320px] w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-40 w-40 rounded-2xl border-2 border-primary/70" />
          </div>
          <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-white">
            اعمل فوكس على الـ QR بتاع الطالب
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-muted">
          الكاميرا غير مدعومة على الجهاز ده، استخدم الإدخال اليدوي.
        </div>
      )}

      {!supported && (
        <div className="mt-4 flex gap-2">
          <input
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value)}
            placeholder="الصق QR هنا"
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          <button
            type="button"
            onClick={handleManualSubmit}
            disabled={manualLoading}
            className="btn-ripple rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {manualLoading ? "..." : "تأكيد"}
          </button>
        </div>
      )}

      {overlay && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center text-center text-white ${
            overlay.status === "success" ? "bg-success/90" : "bg-error/90"
          }`}
        >
          <p className="text-2xl font-semibold">{overlay.title}</p>
          <p className="mt-2 text-sm">{overlay.message}</p>
          {overlay.detail && <p className="mt-1 text-xs">{overlay.detail}</p>}
        </div>
      )}
    </div>
  );
}
