"use client";

import { useEffect } from "react";

const useModalKeyboard = (isOpen, onClose, firstFocusRef) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);

    if (firstFocusRef?.current) {
      firstFocusRef.current.focus();
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, firstFocusRef]);
};

export default useModalKeyboard;
