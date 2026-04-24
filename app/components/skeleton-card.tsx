export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`skeleton h-40 w-full rounded-2xl border border-slate-100 ${className}`}
    />
  );
}
