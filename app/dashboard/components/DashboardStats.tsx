"use client";

import { memo } from "react";
import { CountUp } from "../../components/student/count-up";

type StatItem = {
  icon: string;
  label: string;
  value: number;
  color: string;
  suffix?: string;
};

type DashboardStatsProps = {
  stats: StatItem[];
};

export const DashboardStats = memo(function DashboardStats({
  stats,
}: DashboardStatsProps) {
  return (
    <section className="mt-6 grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-3xl border border-slate-100 bg-white p-4 shadow-card"
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-2xl ${stat.color}`}
            >
              {stat.icon}
            </span>
            <div>
              <p className="text-lg font-semibold">
                <CountUp value={stat.value} />
                {stat.suffix ?? ""}
              </p>
              <p className="text-xs text-muted">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
});
