"use client";

import { useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "../providers/auth-provider";
import { useAntiCheat } from "../hooks/useAntiCheat";
import { useContentViewer } from "../hooks/useContentViewer";
import { Watermark } from "./viewer/Watermark";
import { PDFViewer } from "./viewer/PDFViewer";
import { ERRORS } from "../../constants";

const HLSPlayer = dynamic(() => import("./viewer/HLSPlayer").then((mod) => mod.HLSPlayer), { ssr: false });
const YouTubePlayer = dynamic(() => import("./viewer/YouTubePlayer").then((mod) => mod.YouTubePlayer), {
  ssr: false,
});

const errorMessages = {
  UPGRADE_REQUIRED: ERRORS.UPGRADE_REQUIRED,
  NOT_A_MEMBER: ERRORS.NOT_A_MEMBER,
  NOT_FOUND: "المحتوى مش موجود",
  TOKEN_EXPIRED: ERRORS.TOKEN_EXPIRED,
};

export const ContentViewer = ({ contentId, roomId, contentTitle, onClose }) => {
  const { user } = useAuth();
  const { isHidden } = useAntiCheat();
  const { status, contentData, error, retry } = useContentViewer(roomId, contentId);
  const handleRetry = useCallback(() => retry(), [retry]);
  const handleClose = useCallback(() => onClose(), [onClose]);
  const openExternal = useCallback(() => {
    if (contentData?.url) {
      window.open(contentData.url, "_blank", "noopener,noreferrer");
    }
  }, [contentData]);

  const errorMessage = useMemo(() => {
    if (!error?.code) return "حصل خطأ في تحميل المحتوى";
    return errorMessages[error.code] ?? "حصل خطأ في تحميل المحتوى";
  }, [error]);
  const watermarkVariant =
    contentData?.type === "google_drive" || contentData?.type === "direct_pdf"
      ? "pdf"
      : "default";

  return (
    <div
      className="w-full overflow-hidden rounded-2xl bg-[#0F172A] text-white"
      dir="rtl"
    >
      <div className="flex items-center justify-between bg-[#1E293B] px-4 py-3">
        <div>
          <p className="text-sm font-semibold">{contentTitle ?? "المحتوى"}</p>
          <span className="mt-1 inline-flex rounded-full bg-success/10 px-3 py-1 text-xs text-success">
            🔒 محتوى محمي
          </span>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="إغلاق"
          className="rounded-full bg-slate-700 px-3 py-1 text-xs"
        >
          إغلاق
        </button>
      </div>

      <div className="relative p-4">
        {isHidden && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "#000",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "18px",
            }}
          >
            🔒 المحتوى محمي
          </div>
        )}

        <Watermark
          name={user?.name ?? "طالب"}
          email={user?.email ?? ""}
          variant={watermarkVariant}
        />

        {status === "loading" && (
          <div className="flex h-[420px] flex-col items-center justify-center gap-3 text-sm text-slate-200">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
            جاري التحميل...
          </div>
        )}

        {status === "error" && (
          <div className="flex h-[420px] flex-col items-center justify-center gap-3 text-sm text-slate-200">
            <div className="text-2xl">🔒</div>
            <p>{errorMessage}</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={handleRetry}
                className="rounded-full bg-primary px-4 py-2 text-xs"
              >
                إعادة المحاولة
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full border border-slate-600 px-4 py-2 text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}

        {status === "expired" && (
          <div className="flex h-[420px] flex-col items-center justify-center gap-3 text-sm text-slate-200">
            <div className="text-2xl">⏱️</div>
            <p>انتهت الجلسة — اضغط تحديث</p>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-full bg-primary px-4 py-2 text-xs"
            >
              تحديث
            </button>
          </div>
        )}

        {status === "ready" && contentData && (
          <div className="relative z-[1]">
            {contentData.type === "hls" && <HLSPlayer streamUrl={contentData.streamUrl} />}
            {contentData.type === "youtube" && (
              <YouTubePlayer
                videoId={contentData.videoId}
                userName={user?.name ?? "طالب"}
                userEmail={user?.email ?? ""}
              />
            )}
            {(contentData.type === "google_drive" ||
              contentData.type === "direct_pdf") && (
              <PDFViewer embedUrl={contentData.embedUrl} type={contentData.type} />
            )}
            {contentData.type === "external_link" && (
              <div className="rounded-2xl bg-slate-800 p-6 text-center text-sm">
                <p>رابط خارجي محمي</p>
                <button
                  type="button"
                  onClick={openExternal}
                  disabled={!contentData?.url}
                  className="mt-4 rounded-full bg-primary px-4 py-2 text-xs"
                >
                  فتح الرابط
                </button>
              </div>
            )}
            {!["hls", "youtube", "google_drive", "direct_pdf", "external_link"].includes(contentData.type) && (
              <div className="rounded-2xl bg-slate-800 p-6 text-center text-sm">
                <p>نوع المحتوى غير مدعوم حاليًا</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
