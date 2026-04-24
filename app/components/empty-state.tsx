import Link from "next/link";

type EmptyStateProps = {
  illustration?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({
  illustration = "🫶",
  title,
  subtitle,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-white/60 px-6 py-10 text-center">
      <div className="text-4xl">{illustration}</div>
      <p className="text-lg font-semibold">{title}</p>
      {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="btn-ripple mt-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
