"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CONTROLS_HIDE_MS,
  WATERMARK_VELOCITY,
  WATERMARK_W,
  WATERMARK_H,
  YT_PLAYER_VARS,
} from "../../lib/constants";

const qualityLabels = {
  highres: "4K HD",
  hd1440: "1440p HD",
  hd1080: "1080p HD",
  hd720: "720p HD",
  large: "480p",
  medium: "360p",
  small: "240p",
  tiny: "144p",
  auto: "تلقائي",
};

const PLAYER_STATES = {
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
};

const iconBtnStyle = {
  background: "none",
  border: "none",
  color: "white",
  cursor: "pointer",
  fontSize: "16px",
  padding: "4px 6px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "4px",
  transition: "backgroundColor 0.2s",
};

const qualityItemStyle = (isActive) => ({
  display: "block",
  width: "100%",
  padding: "8px 16px",
  background: isActive ? "#4F46E5" : "none",
  border: "none",
  color: "white",
  cursor: "pointer",
  textAlign: "right",
  fontSize: "13px",
  direction: "rtl",
});

const useBouncingWatermark = (containerRef) => {
  const [position, setPosition] = useState({ x: 40, y: 40 });
  const velocityRef = useRef({ ...WATERMARK_VELOCITY });
  const positionRef = useRef({ x: 40, y: 40 });
  const animFrameRef = useRef(null);

  useEffect(() => {
    const animate = () => {
      const container = containerRef.current;
      if (!container) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const bounds = container.getBoundingClientRect();
      const maxX = Math.max(0, bounds.width - WATERMARK_W);
      const maxY = Math.max(0, bounds.height - WATERMARK_H);

      positionRef.current.x += velocityRef.current.x;
      positionRef.current.y += velocityRef.current.y;

      if (positionRef.current.x <= 0) {
        positionRef.current.x = 0;
        velocityRef.current.x = Math.abs(velocityRef.current.x);
      }
      if (positionRef.current.x >= maxX) {
        positionRef.current.x = maxX;
        velocityRef.current.x = -Math.abs(velocityRef.current.x);
      }
      if (positionRef.current.y <= 0) {
        positionRef.current.y = 0;
        velocityRef.current.y = Math.abs(velocityRef.current.y);
      }
      if (positionRef.current.y >= maxY) {
        positionRef.current.y = maxY;
        velocityRef.current.y = -Math.abs(velocityRef.current.y);
      }

      setPosition({
        x: positionRef.current.x,
        y: positionRef.current.y,
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [containerRef]);

  return position;
};

export const YouTubePlayer = ({ videoId, userName, userEmail }) => {
  const playerRef = useRef(null);
  const isReadyRef = useRef(false);
  const lockedQualityRef = useRef("default");
  const containerRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const playerContainerId = useRef(
    `yt-player-${Math.random().toString(36).slice(2, 11)}`
  ).current;
  const qualitySyncTimeoutRef = useRef(null);
  const qualityRebufferTimeoutRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [availableQualities, setAvailableQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState("auto");
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  const watermarkPosition = useBouncingWatermark(containerRef);

  const formatTime = (secs) => {
    if (!secs || Number.isNaN(secs)) return "0:00";
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = Math.floor(secs % 60)
      .toString()
      .padStart(2, "0");
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds}`;
    }
    return `${minutes}:${seconds}`;
  };

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying && !showQualityMenu) setShowControls(false);
    }, CONTROLS_HIDE_MS);
  }, [isPlaying, showQualityMenu]);

  const safePlayer = () => {
    if (!playerRef.current || !isReadyRef.current) return null;
    return playerRef.current;
  };

  const onPlayerReady = useCallback(
    (event) => {
      playerRef.current = event.target;
      isReadyRef.current = true;
      setPlayerReady(true);
      if (typeof playerRef.current?.setVolume === "function") {
        playerRef.current.setVolume(volume);
      }
      if (typeof event.target.getDuration === "function") {
        setDuration(event.target.getDuration());
      }
    },
    [volume]
  );

  const onPlayerStateChange = useCallback(
    (event) => {
      const player = event?.target;
      if (!player) return;

      if (
        lockedQualityRef.current !== "default" &&
        lockedQualityRef.current !== "auto"
      ) {
        if (typeof player.setPlaybackQuality === "function") {
          try {
            player.setPlaybackQuality(lockedQualityRef.current);
          } catch (error) {
            console.warn("Failed to enforce YouTube quality", error);
          }
        }
      }

      switch (event.data) {
        case PLAYER_STATES.PLAYING: {
          setIsPlaying(true);
          setIsBuffering(false);
          const qualities =
            typeof player.getAvailableQualityLevels === "function"
              ? player.getAvailableQualityLevels()
              : [];
          if (qualities.length > 0) setAvailableQualities(qualities);
          const actualQuality =
            typeof player.getPlaybackQuality === "function"
              ? player.getPlaybackQuality()
              : "auto";
          if (lockedQualityRef.current === "default") {
            setCurrentQuality(actualQuality);
          }
          break;
        }
        case PLAYER_STATES.PAUSED:
          setIsPlaying(false);
          break;
        case PLAYER_STATES.BUFFERING:
          setIsBuffering(true);
          if (
            lockedQualityRef.current !== "default" &&
            lockedQualityRef.current !== "auto"
          ) {
            if (typeof player.setPlaybackQuality === "function") {
              try {
                player.setPlaybackQuality(lockedQualityRef.current);
              } catch (error) {
                console.warn("Failed to apply quality during buffering", error);
              }
            }
          }
          break;
        case PLAYER_STATES.ENDED:
          setIsPlaying(false);
          setProgress(100);
          break;
        default:
          break;
      }
    },
    []
  );

  const onQualityChange = useCallback((event) => {
    const actualQuality = event.data;
    if (
      lockedQualityRef.current !== "default" &&
      lockedQualityRef.current !== "auto" &&
      actualQuality !== lockedQualityRef.current
    ) {
      if (qualitySyncTimeoutRef.current) {
        clearTimeout(qualitySyncTimeoutRef.current);
      }
      qualitySyncTimeoutRef.current = setTimeout(() => {
        const player = safePlayer();
        if (!player) return;
        if (typeof player.setPlaybackQuality === "function") {
          player.setPlaybackQuality(lockedQualityRef.current);
        }
      }, 100);
    } else {
      setCurrentQuality(actualQuality);
    }
  }, []);

  useEffect(() => {
    if (!isPlaying) setShowControls(true);
  }, [isPlaying]);

  useEffect(() => {
    if (showQualityMenu) setShowControls(true);
  }, [showQualityMenu]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && ["S", "U", "C", "P"].includes(event.key.toUpperCase())) {
        event.preventDefault();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const player = safePlayer();
      if (!player) return;
      if (
        typeof player.getCurrentTime !== "function" ||
        typeof player.getDuration !== "function"
      ) {
        return;
      }
      const current = player.getCurrentTime();
      const total = player.getDuration();
      setCurrentTime(current);
      setDuration(total);
      setProgress(total > 0 ? (current / total) * 100 : 0);
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    const createPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      new window.YT.Player(playerContainerId, {
        videoId,
        playerVars: {
          ...YT_PLAYER_VARS,
          origin: window.location.origin,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
          onPlaybackQualityChange: onQualityChange,
        },
      });
    };

    setPlayerReady(false);

    const previousReady = window.onYouTubeIframeAPIReady;
    const readyHandler = () => {
      if (typeof previousReady === "function") previousReady();
      createPlayer();
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else if (!document.getElementById("yt-api-script")) {
      const script = document.createElement("script");
      script.id = "yt-api-script";
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
      window.onYouTubeIframeAPIReady = readyHandler;
    } else {
      window.onYouTubeIframeAPIReady = readyHandler;
    }

    return () => {
      isReadyRef.current = false;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (error) {
          console.warn("Failed to destroy YouTube player", error);
        }
        playerRef.current = null;
      }
      if (window.onYouTubeIframeAPIReady === readyHandler) {
        window.onYouTubeIframeAPIReady = previousReady ?? null;
      }
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      if (qualitySyncTimeoutRef.current) clearTimeout(qualitySyncTimeoutRef.current);
      if (qualityRebufferTimeoutRef.current) clearTimeout(qualityRebufferTimeoutRef.current);
    };
  }, [onPlayerReady, onPlayerStateChange, onQualityChange, playerContainerId, videoId]);

  useEffect(() => {
    const handleFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreen);
    return () => document.removeEventListener("fullscreenchange", handleFullscreen);
  }, []);

  const togglePlay = useCallback(() => {
    const player = safePlayer();
    if (!player) return;
    if (isPlaying) {
      if (typeof player.pauseVideo === "function") {
        player.pauseVideo();
      }
    } else if (typeof player.playVideo === "function") {
      player.playVideo();
    }
  }, [isPlaying]);

  const handleSeek = useCallback((event) => {
    const player = safePlayer();
    if (!player || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = Math.min(rect.width, Math.max(0, event.clientX - rect.left));
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    if (typeof player.seekTo === "function") {
      player.seekTo(newTime, true);
    }
    setProgress(percentage * 100);
  }, [duration]);

  const handleVolume = useCallback((value) => {
    const player = safePlayer();
    setVolume(value);
    if (!player) return;
    if (typeof player.setVolume === "function") {
      player.setVolume(value);
    }
    if (value === 0) {
      if (typeof player.mute === "function") {
        player.mute();
      }
      setIsMuted(true);
    } else {
      if (typeof player.unMute === "function") {
        player.unMute();
      }
      setIsMuted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const player = safePlayer();
    if (!player) return;
    if (isMuted) {
      if (typeof player.unMute === "function") {
        player.unMute();
      }
      if (typeof player.setVolume === "function") {
        player.setVolume(volume || 80);
      }
      setIsMuted(false);
    } else {
      if (typeof player.mute === "function") {
        player.mute();
      }
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
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

  // NOTE: YouTube's setPlaybackQuality() is partially deprecated.
  // We work around this by:
  // 1. Storing locked quality in a ref
  // 2. Re-applying on every state change
  // 3. Seeking to force re-buffer at new quality
  // 4. Catching YouTube's revert in onPlaybackQualityChange
  // This gives ~90% success rate — YouTube may still
  // override on adaptive network conditions.
  const changeQuality = useCallback((quality) => {
    const player = safePlayer();
    if (!player) return;

    lockedQualityRef.current = quality;
    setShowQualityMenu(false);

    if (quality === "auto") {
      lockedQualityRef.current = "default";
      if (typeof player.setPlaybackQualityRange === "function") {
        player.setPlaybackQualityRange("default");
      }
      if (typeof player.setPlaybackQuality === "function") {
        player.setPlaybackQuality("default");
      }
      return;
    }

    const currentTime =
      typeof player.getCurrentTime === "function" ? player.getCurrentTime() : 0;
    const wasPlaying =
      typeof player.getPlayerState === "function"
        ? player.getPlayerState() === PLAYER_STATES.PLAYING
        : false;

    if (typeof player.setPlaybackQualityRange === "function") {
      player.setPlaybackQualityRange(quality, quality);
    }
    if (typeof player.setPlaybackQuality === "function") {
      player.setPlaybackQuality(quality);
    }

    if (qualityRebufferTimeoutRef.current) {
      clearTimeout(qualityRebufferTimeoutRef.current);
    }
    qualityRebufferTimeoutRef.current = setTimeout(() => {
      const playerRetry = safePlayer();
      if (!playerRetry) return;
      try {
        playerRetry.loadVideoById({
          videoId,
          startSeconds: currentTime,
          suggestedQuality: quality,
        });
      } catch (error) {
        console.warn("loadVideoById quality switch failed, fallback to seek", error);
        playerRetry.seekTo(currentTime, true);
      }
      if (typeof playerRetry.setPlaybackQualityRange === "function") {
        playerRetry.setPlaybackQualityRange(quality, quality);
      }
      if (typeof playerRetry.setPlaybackQuality === "function") {
        playerRetry.setPlaybackQuality(quality);
      }
      if (wasPlaying) {
        if (typeof playerRetry.playVideo === "function") {
          playerRetry.playVideo();
        }
      } else {
        if (typeof playerRetry.pauseVideo === "function") {
          playerRetry.pauseVideo();
        }
      }
    }, 120);
  }, [videoId]);

  const qualityMenu = useMemo(() => {
    if (!availableQualities.length) return [];
    const unique = Array.from(
      new Set(availableQualities.filter((q) => q && q !== "auto"))
    );
    return ["auto", ...unique];
  }, [availableQualities]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && !showQualityMenu && setShowControls(false)}
      style={{
        position: "relative",
        width: "100%",
        paddingBottom: "56.25%",
        backgroundColor: "#000",
        borderRadius: "12px",
        overflow: "hidden",
        userSelect: "none",
        cursor: showControls ? "default" : "none",
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div
        id={playerContainerId}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />

      <div
        style={{ position: "absolute", inset: 0, zIndex: 5 }}
        onContextMenu={(event) => event.preventDefault()}
        onClick={togglePlay}
      />

      {!playerReady && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 30,
            borderRadius: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
              color: "white",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "3px solid rgba(255,255,255,0.2)",
                borderTop: "3px solid #4F46E5",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <span style={{ fontSize: "14px", color: "#94A3B8" }}>
              جاري تحميل الفيديو...
            </span>
          </div>
        </div>
      )}

      {isBuffering && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 15,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "4px solid rgba(255,255,255,0.2)",
              borderTop: "4px solid white",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        </div>
      )}

      <div
        style={{
          position: "absolute",
          left: `${watermarkPosition.x}px`,
          top: `${watermarkPosition.y}px`,
          pointerEvents: "none",
          zIndex: 20,
          backgroundColor: "rgba(0, 0, 0, 0.25)",
          backdropFilter: "blur(2px)",
          borderRadius: "6px",
          padding: "6px 12px",
          border: "1px solid rgba(255,255,255,0.1)",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        <p
          style={{
            color: "rgba(255, 255, 255, 0.55)",
            fontSize: "11px",
            fontFamily: "monospace",
            margin: 0,
            lineHeight: "1.5",
            whiteSpace: "nowrap",
          }}
        >
          {userName}
          <br />
          {userEmail}
        </p>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 25,
          background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
          padding: "40px 16px 12px",
          transition: "opacity 0.3s ease",
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? "auto" : "none",
        }}
      >
        <div
          onClick={handleSeek}
          style={{
            width: "100%",
            height: "4px",
            backgroundColor: "rgba(255,255,255,0.3)",
            borderRadius: "2px",
            cursor: "pointer",
            marginBottom: "10px",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${progress}%`,
              backgroundColor: "#4F46E5",
              borderRadius: "2px",
              transition: "width 0.1s linear",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: `${progress}%`,
              transform: "translate(-50%, -50%)",
              width: "12px",
              height: "12px",
              backgroundColor: "#4F46E5",
              borderRadius: "50%",
              boxShadow: "0 0 4px rgba(79,70,229,0.8)",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "white",
            gap: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flex: 1,
            }}
          >
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
              style={iconBtnStyle}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted || volume === 0 ? "إلغاء كتم الصوت" : "كتم الصوت"}
              style={iconBtnStyle}
            >
              {isMuted || volume === 0 ? "🔇" : volume < 50 ? "🔉" : "🔊"}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(event) => handleVolume(Number(event.target.value))}
              aria-label="مستوى الصوت"
              style={{
                width: "70px",
                accentColor: "#4F46E5",
                cursor: "pointer",
              }}
            />
            <span
              style={{
                fontSize: "12px",
                color: "#CBD5E1",
                fontFamily: "monospace",
                whiteSpace: "nowrap",
              }}
            >
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              position: "relative",
            }}
          >
            {qualityMenu.length > 0 && (
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setShowQualityMenu((value) => !value)}
                  style={{
                    ...iconBtnStyle,
                    fontSize: "11px",
                    padding: "4px 8px",
                    backgroundColor: "rgba(255,255,255,0.15)",
                    borderRadius: "4px",
                    fontFamily: "monospace",
                  }}
                >
                  {lockedQualityRef.current === "default" ||
                  lockedQualityRef.current === "auto"
                    ? qualityLabels[currentQuality] || "تلقائي"
                    : qualityLabels[lockedQualityRef.current] ||
                      lockedQualityRef.current}
                  {" ⚙"}
                </button>
                {showQualityMenu && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "110%",
                      right: 0,
                      backgroundColor: "#1E293B",
                      borderRadius: "8px",
                      overflow: "hidden",
                      minWidth: "120px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      zIndex: 30,
                    }}
                  >
                    {qualityMenu.map((quality) => (
                      <button
                        type="button"
                        key={quality}
                        onClick={() => changeQuality(quality)}
                        style={qualityItemStyle(currentQuality === quality)}
                      >
                        {qualityLabels[quality] || quality}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "الخروج من ملء الشاشة" : "ملء الشاشة"}
              style={iconBtnStyle}
            >
              {isFullscreen ? "🗗" : "⛶"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
