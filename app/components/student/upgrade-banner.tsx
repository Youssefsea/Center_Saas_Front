export function UpgradeBanner({
  price,
  lockedCount,
  onUpgrade,
}: {
  price: number;
  lockedCount: number;
  onUpgrade: () => void;
}) {
  return (
    <div className="rounded-3xl bg-gradient-to-l from-accent/20 to-accent/5 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold">
            🔓 في {lockedCount} محتوى مدفوع مش شايفه
          </p>
          <p className="text-xs text-muted">ترقية الوصول — {price} جنيه</p>
        </div>
        <button
          type="button"
          onClick={onUpgrade}
          className="btn-ripple rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          ترقية الوصول
        </button>
      </div>
    </div>
  );
}
