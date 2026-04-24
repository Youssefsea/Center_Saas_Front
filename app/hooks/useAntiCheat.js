"use client";

import { useEffect, useRef, useState } from "react";
import {
  ANTI_CHEAT_HIDE_MS,
  DEBUGGER_INTERVAL_MS,
  DEVTOOLS_CHECK_MS,
} from "../lib/constants";

export const useAntiCheat = () => {
  const [isHidden, setIsHidden] = useState(false);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    const handleContextMenu = (event) => event.preventDefault();
    const handleKeyDown = (event) => {
      if (event.key === "F12") event.preventDefault();
      if (
        event.ctrlKey &&
        event.shiftKey &&
        ["I", "J", "C"].includes(event.key)
      ) {
        event.preventDefault();
      }
      if (event.ctrlKey && event.key === "U") event.preventDefault();
      if (event.key === "PrintScreen") {
        setIsHidden(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(
          () => setIsHidden(false),
          ANTI_CHEAT_HIDE_MS
        );
      }
    };

    const handleVisibility = () => {
      setIsHidden(document.hidden);
    };

    const detect = () => {
      const threshold = 160;
      return (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      );
    };

    setIsHidden(detect());
    const devtoolsInterval = setInterval(() => {
      setIsHidden(detect());
    }, DEVTOOLS_CHECK_MS);

    const debuggerInterval = setInterval(() => {
      // eslint-disable-next-line no-debugger
      debugger;
    }, DEBUGGER_INTERVAL_MS);

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(devtoolsInterval);
      clearInterval(debuggerInterval);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return { isHidden };
};
