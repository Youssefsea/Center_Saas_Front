import Link from "next/link";
import { memo } from "react";

export type CenterSummary = {
  id: string;
  name: string;
  address: string;
  distanceKm?: number | null;
  teachersCount?: number | null;
};

export const CenterCard = memo(function CenterCard({
  center,
}: {
  center: CenterSummary;
}) {
  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-100 bg-card p-5 shadow-card transition hover:scale-[1.02] hover:shadow-lift">
      <div>
        <h3 className="text-lg font-semibold">{center.name}</h3>
        <p className="mt-1 text-sm text-muted">{center.address}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {typeof center.distanceKm === "number" && (
            <span className="rounded-full bg-secondary/15 px-2 py-1 text-secondary">
              {center.distanceKm.toFixed(1)} كم
            </span>
          )}
          {typeof center.teachersCount === "number" && (
            <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
              {center.teachersCount} مدرس
            </span>
          )}
        </div>
      </div>
      <Link
        href={`/centers/${center.id}`}
        className="btn-ripple mt-4 inline-flex items-center justify-center rounded-full border border-primary/20 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5 active:scale-[0.97]"
      >
        عرض التفاصيل
      </Link>
    </div>
  );
});
