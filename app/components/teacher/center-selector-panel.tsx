export type CenterSelectorItem = {
  id: string;
  name: string;
  contentCount: number;
};

export function CenterSelectorPanel({
  centers,
  selectedId,
  onSelect,
}: {
  centers: CenterSelectorItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="hidden w-[280px] shrink-0 rounded-3xl border border-slate-100 bg-white p-4 shadow-card lg:block">
      <h3 className="text-base font-semibold">اختار المركز</h3>
      <div className="mt-4 space-y-2">
        {centers.map((center) => {
          const isActive = center.id === selectedId;
          return (
            <button
              key={center.id}
              type="button"
              onClick={() => onSelect(center.id)}
              className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-sm ${
                isActive
                  ? "border-primary border-l-4 bg-primary/5 text-primary"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs ${
                    isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {center.name.slice(0, 2)}
                </span>
                <span>{center.name}</span>
              </span>
              <span className="text-xs text-muted">{center.contentCount} محتوى</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
