// Timing
export const TOKEN_REFRESH_MS = 3.5 * 60 * 60 * 1000;
export const SEARCH_DEBOUNCE_MS = 500;
export const CONTROLS_HIDE_MS = 3000;
export const WATERMARK_RERENDER_MS = 3000;
export const ATTENDANCE_REFRESH_MS = 30000;
export const COPY_FEEDBACK_MS = 2000;
export const TOAST_DISMISS_MS = 4000;

// Pagination
export const DEFAULT_LIMIT = 20;
export const CONTENT_LIMIT = 50;
export const REVIEWS_LIMIT = 20;

// Map
export const CAIRO_LAT = 30.0444;
export const CAIRO_LNG = 31.2357;
export const DEFAULT_RADIUS_KM = 10;

// Validation
export const PHONE_REGEX = /^(010|011|012|015)\d{8}$/;
export const EGYPTIAN_PHONE_PREFIXES = ["010", "011", "012", "015"];
export const MAX_TITLE_LENGTH = 255;
export const MIN_DEPOSIT_AMOUNT = 10;
export const MAX_DEPOSIT_AMOUNT = 10000;

// Content
export const WATERMARK_VELOCITY = { x: 0.4, y: 0.3 };
export const WATERMARK_W = 200;
export const WATERMARK_H = 55;
export const TOKEN_EXPIRY_HOURS = 4;
export const YT_PLAYER_VARS = {
  controls: 0,
  disablekb: 1,
  rel: 0,
  modestbranding: 1,
  iv_load_policy: 3,
  playsinline: 1,
  fs: 0,
};


// Arabic UI strings — error messages
export const ERRORS = {
  INSUFFICIENT_BALANCE: "رصيدك مش كفاية",
  SESSION_FULL: "الحصة اكتملت للأسف",
  ALREADY_BOOKED: "انت حاجز الحصة دي بالفعل",
  NOT_A_MEMBER: "مش عضو في الـ Room دي",
  UPGRADE_REQUIRED: "المحتوى ده للأعضاء المدفوعين بس",
  TOKEN_EXPIRED: "انتهت الجلسة، افتح المحتوى تاني",
  SERVER_ERROR: "حصل خطأ، حاول تاني",
  NETWORK_ERROR: "تأكد من الإنترنت وحاول تاني",
};

// API base
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://senter-saas-backend.vercel.app";

// App-specific constants
export const gradeLevels = [
  "ابتدائي أولى",
  "ابتدائي تانية",
  "ابتدائي تالتة",
  "ابتدائي رابعة",
  "ابتدائي خامسة",
  "ابتدائي سادسة",
  "إعدادي أولى",
  "إعدادي تانية",
  "إعدادي تالتة",
  "ثانوي أولى",
  "ثانوي تانية",
  "ثانوي تالتة",
];

export const subjectIcons = {
  Math: "📐",
  Mathematics: "📐",
  Physics: "⚡",
  Chemistry: "🧪",
  Biology: "🧬",
  Arabic: "📖",
  English: "🌍",
  French: "🇫🇷",
  Science: "🔬",
};

export const roleRedirects = {
  student: "/dashboard",
  teacher: "/teacher/dashboard",
  center_admin: "/admin/dashboard",
  super_admin: "/super/dashboard",
};

export const DEVTOOLS_CHECK_MS = 2000;
export const DEBUGGER_INTERVAL_MS = 1000;
export const ANTI_CHEAT_HIDE_MS = 500;
export const QR_OVERLAY_SUCCESS_MS = 2000;
export const QR_OVERLAY_ERROR_MS = 2500;
export const REGISTER_REDIRECT_MS = 1200;
