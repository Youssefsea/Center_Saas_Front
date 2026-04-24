"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, getErrorMessage } from "../lib/api";
import { TOKEN_REFRESH_MS } from "../lib/constants";

export const useContentViewer = (roomId, contentId) => {
  const [status, setStatus] = useState("idle");
  const [contentData, setContentData] = useState(null);
  const [error, setError] = useState(null);
  const refreshTimer = useRef(null);
  const abortRef = useRef(null);
  const mountedRef = useRef(true);

  const clearRefresh = () => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  };

  const fetchContent = useCallback(async () => {
    if (!roomId || !contentId) return;
    clearRefresh();
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;
    if (mountedRef.current) {
      setStatus("loading");
      setContentData(null);
      setError(null);
    }

    try {
      const tokenRes = await api.get(`/rooms/${roomId}/content/token`, {
        params: { contentId },
        signal: controller.signal,
      });
      const { token, urlType } = tokenRes.data ?? {};

      if (urlType === "direct_pdf") {
        const baseUrl = api.defaults.baseURL ?? "";
        if (mountedRef.current) {
          setContentData({
            type: "direct_pdf",
            embedUrl: `${baseUrl}/rooms/${roomId}/content/stream?token=${token}&contentId=${contentId}`,
          });
          setStatus("ready");
        }
      } else {
        const streamRes = await api.get(`/rooms/${roomId}/content/stream`, {
          params: { token, contentId },
          signal: controller.signal,
        });
        if (mountedRef.current) {
          setContentData(streamRes.data ?? null);
          setStatus("ready");
        }
      }

      clearRefresh();
      refreshTimer.current = setTimeout(fetchContent, TOKEN_REFRESH_MS);
    } catch (err) {
      if (controller.signal.aborted) return;
      clearRefresh();
      const data = err?.response?.data ?? {};
      const code = data?.error?.code ?? null;
      const message = getErrorMessage(data);
      if (!mountedRef.current) return;
      if (code === "TOKEN_EXPIRED") {
        setStatus("expired");
        setError({ code, message });
      } else {
        setStatus("error");
        setError({ code, message });
      }
    }
  }, [roomId, contentId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchContent();
    return () => {
      mountedRef.current = false;
      clearRefresh();
      abortRef.current?.abort?.();
    };
  }, [fetchContent]);

  return { status, contentData, error, retry: fetchContent };
};
