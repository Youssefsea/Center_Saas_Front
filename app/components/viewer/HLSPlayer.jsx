"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export const HLSPlayer = ({ streamUrl }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    if (Hls.isSupported()) {
      hlsRef.current = new Hls({ enableWorker: true, lowLatencyMode: false });
      hlsRef.current.loadSource(streamUrl);
      hlsRef.current.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
    }

    const onTimeUpdate = () => setProgress(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [streamUrl]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch((error) => {
        console.error("Failed to play HLS video", error);
      });
    } else {
      video.pause();
    }
  }, []);

  const handleProgress = useCallback((event) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const percentage = Math.min(100, Math.max(0, Number(event.target.value)));
    const newTime = (percentage / 100) * duration;
    video.currentTime = newTime;
    setProgress(newTime);
  }, [duration]);

  const handleVolume = useCallback((event) => {
    const value = parseFloat(event.target.value);
    const video = videoRef.current;
    if (!video) return;
    video.volume = value;
    setVolume(value);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = videoRef.current?.parentElement;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((error) => {
        console.error("Failed to enter fullscreen", error);
      });
    } else {
      document.exitFullscreen().catch((error) => {
        console.error("Failed to exit fullscreen", error);
      });
    }
  }, []);

  const formatTime = (secs) => {
    if (!secs || Number.isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "#000",
        borderRadius: "12px",
        overflow: "hidden",
        userSelect: "none",
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <video
        ref={videoRef}
        style={{ width: "100%", display: "block" }}
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        playsInline
      />

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
          padding: "32px 16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <input
          type="range"
          min="0"
          max="100"
          value={duration ? (progress / duration) * 100 : 0}
          onChange={handleProgress}
          aria-label="تقدم الفيديو"
          style={{
            width: "100%",
            height: "4px",
            accentColor: "#4F46E5",
            cursor: "pointer",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "white",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? "إيقاف مؤقت" : "تشغيل"}
              style={btnStyle}
            >
              {playing ? "⏸" : "▶️"}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolume}
              aria-label="مستوى الصوت"
              style={{
                width: "70px",
                accentColor: "#4F46E5",
                cursor: "pointer",
              }}
            />
            <span style={{ fontSize: "12px", color: "#CBD5E1" }}>
              {formatTime(progress)} / {formatTime(duration)}
            </span>
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "الخروج من ملء الشاشة" : "ملء الشاشة"}
            style={btnStyle}
          >
            {isFullscreen ? "🗗" : "⛶"}
          </button>
        </div>
      </div>
    </div>
  );
};

const btnStyle = {
  background: "none",
  border: "none",
  color: "white",
  cursor: "pointer",
  fontSize: "18px",
  padding: "4px",
  display: "flex",
  alignItems: "center",
};
