"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { SkeletonCard } from "./skeleton-card";
import useModalKeyboard from "../hooks/useModalKeyboard";

const ContentViewer = dynamic(() => import("./ContentViewer").then((mod) => mod.ContentViewer), {
  ssr: false,
  loading: () => <SkeletonCard className="h-[480px]" />,
});

export const ContentModal = ({ content, roomId, onClose }) => {
  const closeRef = useRef(null);
  useModalKeyboard(Boolean(content), onClose, closeRef);

  if (!content) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="dialog"
      aria-modal="true"
      aria-label={content?.title ? `عرض ${content.title}` : "عرض المحتوى"}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-[960px]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute -top-3 left-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/70 text-white"
        >
          ×
        </button>
        <ContentViewer
          contentId={content.id}
          roomId={roomId}
          contentTitle={content.title}
          onClose={onClose}
        />
      </motion.div>
    </motion.div>
  );
};
