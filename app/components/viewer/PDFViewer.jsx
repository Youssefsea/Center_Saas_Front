"use client";

export const PDFViewer = ({ embedUrl, type }) => {
  const src =
    type === "google_drive"
      ? `${embedUrl}${embedUrl.includes("?") ? "&" : "?"}rm=minimal`
      : embedUrl;

  return (
    <iframe
      title="pdf-viewer"
      src={src}
      loading="lazy"
      referrerPolicy="no-referrer"
      allow="fullscreen"
      className="h-[500px] w-full rounded-2xl border-0 md:h-[700px]"
    />
  );
};
