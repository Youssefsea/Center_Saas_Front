"use client";

type AttendanceEntry = {
  id: string;
  name: string;
  status: "attended" | "no_show" | "cancelled";
  time?: string | null;
};

export function AttendanceSummary({
  total,
  attended,
  noShow,
  cancelled,
  entries,
}: {
  total: number;
  attended: number;
  noShow: number;
  cancelled: number;
  entries: AttendanceEntry[];
}) {
  return (
    <div className="mt-8 space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        {[
          { label: "إجمالي الحجوزات", value: total, color: "bg-primary/10 text-primary" },
          { label: "حضر", value: attended, color: "bg-success/10 text-success" },
          { label: "غائب", value: noShow, color: "bg-error/10 text-error" },
          { label: "ملغي", value: cancelled, color: "bg-slate-200 text-slate-600" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl bg-white p-4 shadow-card">
            <p className="text-xs text-muted">{item.label}</p>
            <p className={`mt-2 text-lg font-semibold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-card">
        <h3 className="text-base font-semibold">قائمة الحضور</h3>
        <div className="mt-4 space-y-3">
          {entries.map((student) => (
            <div
              key={student.id}
              className="flex flex-col gap-2 rounded-2xl border border-slate-100 p-3 text-sm md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {student.name.slice(0, 1)}
                </div>
                <span className="font-medium">{student.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted">
                <span>
                  {student.status === "attended"
                    ? "✅ حضر"
                    : student.status === "no_show"
                    ? "❌ غائب"
                    : "🚫 ملغي"}
                </span>
                {student.time && <span>{student.time}</span>}
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-muted">
              مفيش بيانات حضور
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
