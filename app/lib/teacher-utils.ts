export const formatArabicDate = (date: string | Date) =>
  new Date(date).toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export const formatArabicTime = (date: string | Date) =>
  new Date(date).toLocaleTimeString("ar-EG", {
    hour: "numeric",
    minute: "2-digit",
  });

export const formatArabicDateTime = (date: string | Date) =>
  `${formatArabicDate(date)}، ${formatArabicTime(date)}`;

export const formatRelative = (date: string | Date) => {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) {
    const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
    return `منذ ${diffHours} ساعات`;
  }
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  return formatArabicDate(date);
};

export const getTeacherGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "صباح النور، جاهز للحصص النهارده؟";
  if (hour >= 12 && hour < 17) return "تمام، كمّل يومك بنجاح!";
  return "مساء النور، شوف ملخص يومك";
};

export const getCountdownLabel = (date: string | Date) => {
  const today = new Date();
  const target = new Date(date);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );
  const diffMs = startOfTarget.getTime() - startOfToday.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return null;
  if (diffDays === 0) return { label: "النهارده!", variant: "today" as const };
  if (diffDays === 1) return { label: "بكره", variant: "soon" as const };
  if (diffDays <= 7)
    return { label: `بعد ${diffDays} أيام`, variant: "soon" as const };
  return null;
};

export const getSeatFill = (booked: number, capacity: number) => {
  if (capacity <= 0) return 0;
  return Math.min((booked / capacity) * 100, 100);
};

export const getSeatColor = (percent: number) => {
  if (percent >= 80) return "bg-error";
  if (percent >= 50) return "bg-accent";
  return "bg-success";
};

export const formatRating = (rating?: number | null) =>
  typeof rating === "number" ? rating.toFixed(1) : "0.0";
