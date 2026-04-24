"use client";

type StarRatingProps = {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function StarRating({
  value,
  max = 5,
  onChange,
  size = "md",
}: StarRatingProps) {
  const isInteractive = Boolean(onChange);

  return (
    <div className={`flex items-center gap-1 ${sizeClasses[size]}`} dir="ltr">
      {Array.from({ length: max }).map((_, index) => {
        const starValue = index + 1;
        const filled = starValue <= Math.round(value);
        const baseClass = filled ? "text-accent" : "text-slate-300";
        if (!isInteractive) {
          return (
            <span key={starValue} className={baseClass}>
              ★
            </span>
          );
        }
        return (
          <button
            key={starValue}
            type="button"
            className={`${baseClass} transition hover:scale-110`}
            onClick={() => onChange?.(starValue)}
            aria-label={`تقييم ${starValue} نجوم`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
