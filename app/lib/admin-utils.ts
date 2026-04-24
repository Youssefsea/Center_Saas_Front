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

export const isSameDay = (date: string | Date) => {
  const now = new Date();
  const target = new Date(date);
  return (
    now.getFullYear() === target.getFullYear() &&
    now.getMonth() === target.getMonth() &&
    now.getDate() === target.getDate()
  );
};

export const getSeatFill = (booked: number, capacity: number) => {
  if (capacity <= 0) return 0;
  return Math.min((booked / capacity) * 100, 100);
};

export const getSeatColor = (percent: number) => {
  if (percent > 70) return "bg-error";
  if (percent > 40) return "bg-accent";
  return "bg-success";
};

export const formatRelative = (date: string | Date) => {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) {
    const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
    return `منذ ${diffHours} ساعات`;
  }
  if (diffDays < 7) {
    return `منذ ${diffDays} أيام`;
  }
  return formatArabicDate(date);
};
